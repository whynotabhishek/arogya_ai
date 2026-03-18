/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { classifyIntent, classifySeverity, generateHealthResponse, type HealthIntent } from "@/lib/groq";
import { murfSpeechToText, murfTextToSpeech } from "@/lib/murf";
import type { SupportedLanguage } from "@/prompts/health";
import { buildContext, type Message } from "@/lib/memory";
import { checkEmergencyRules } from "@/lib/rule-engine";
import { checkEscalation } from "@/lib/symptom-tracker";
import { cacheKey, getCached, setCache } from "@/lib/cache";
import {
    detectSymptomCategory,
    containsSymptom,
    shouldSkipInterview,
    getNextQuestion,
    getTotalQuestions,
    buildInterviewContext,
    type InterviewState,
    type SymptomCategory,
} from "@/lib/symptom-interview";

import { calculateRiskScore as calcRisk } from "@/lib/risk-engine";
import medicines from "@/lib/rag/medicines.json";
import symptoms from "@/lib/rag/symptoms.json";
import clinics from "@/lib/rag/clinics.json";

type Clinic = {
    name: string;
    district: string;
    lat: number;
    lng: number;
    timing: string;
    phone: string;
};

type VoicePayload = {
    message?: string;
    audio?: string;
    audioBase64?: string;
    mimeType?: string;
    language?: SupportedLanguage;
    lat?: number;
    lng?: number;
    history?: Message[];
    patientProfile?: any;
    symptomsTracker?: any;
    interviewState?: InterviewState;
    caretakerAge?: number;
};

function distanceInKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function nearestClinic(lat?: number, lng?: number): Clinic | undefined {
    if (typeof lat !== "number" || typeof lng !== "number") {
        return undefined;
    }

    return (clinics as Clinic[])
        .map((clinic) => ({
            clinic,
            distance: distanceInKm(lat, lng, clinic.lat, clinic.lng),
        }))
        .sort((a, b) => a.distance - b.distance)[0]?.clinic;
}

function contextByIntent(intent: HealthIntent, message: string): string {
    const normalized = message.toLowerCase();

    if (intent === "medicine_query") {
        const matches = (medicines as Array<{ name: string; generic: string; use: string; dosage: string; warnings: string }>).filter(
            (item) =>
                normalized.includes(item.name.toLowerCase()) ||
                normalized.includes(item.generic.toLowerCase()),
        );
        return JSON.stringify(matches.slice(0, 4));
    }

    if (intent === "symptom" || intent === "emergency") {
        const matches = (symptoms as Array<{ symptom: string; severity: string; advice: string; escalate_if: string }>).filter(
            (item) => normalized.includes(item.symptom.toLowerCase()),
        );
        return JSON.stringify(matches.slice(0, 6));
    }

    if (intent === "location") {
        return JSON.stringify((clinics as Clinic[]).slice(0, 6));
    }

    return "General health support for rural Indian users. Recommend PHC visit for unresolved concerns.";
}

export async function POST(req: Request) {
    try {
        const payload = (await req.json()) as VoicePayload;
        const language = payload.language ?? "english";

        let message = payload.message?.trim();
        const base64Audio = payload.audio || payload.audioBase64;
        if (!message && base64Audio) {
            message = await murfSpeechToText({
                audioBase64: base64Audio,
                language,
                mimeType: payload.mimeType,
            });
        }

        if (!message) {
            return NextResponse.json(
                { error: "Please share your question so I can help." },
                { status: 400 },
            );
        }

        // ── Emergency Rules FIRST ──────────────────────
        const emergencyRule = checkEmergencyRules(message);
        if (emergencyRule) {
            const riskScore = calcRisk(payload.patientProfile, payload.symptomsTracker, payload.history);
            const emergencyClinic = nearestClinic(payload.lat, payload.lng) ?? (clinics as Clinic[])[0];
            const emergencySeverity = emergencyRule.severity === "high" ? "urgent" : emergencyRule.severity;
            
            // Simple 3-sentence emergency response
            const emergencyTexts: Record<string, string> = {
                kannada: "ಇದು ತುರ್ತು ಪರಿಸ್ಥಿತಿ, ತಕ್ಷಣ 108 ಕರೆ ಮಾಡಿ. ರೋಗಿಯನ್ನು ಮಲಗಿಸಿ ಮತ್ತು ಶಾಂತವಾಗಿರಿ. ಸಮೀಪದ PHC ಗೆ ತಕ್ಷಣ ಹೋಗಿ.",
                hindi: "यह आपातकालीन स्थिति है, तुरंत 108 कॉल करें। मरीज़ को लिटाएं और शांत रहें। नजदीकी PHC में तुरंत जाएं।",
                telugu: "ఇది అత్యవసర పరిస్థితి, వెంటనే 108 కాల్ చేయండి. రోగిని పడుకోబెట్టండి మరియు శాంతంగా ఉండండి. దగ్గరలోని PHC కి వెంటనే వెళ్ళండి.",
                english: "This is an emergency, call 108 immediately. Keep the patient lying down and stay calm. Go to the nearest PHC right away.",
            };
            const emergencyText = emergencyTexts[language] || emergencyTexts.english;

            let emergencyAudio = "";
            try {
                emergencyAudio = await murfTextToSpeech({ text: emergencyText, language, urgent: true });
            } catch { /* non-fatal */ }

            return NextResponse.json({
                text: emergencyText,
                audio: emergencyAudio,
                severity: emergencySeverity,
                intent: emergencyRule.action,
                clinic: emergencyClinic,
                transcript: message,
                riskScore,
                responseType: "advice" as const,
            });
        }

        // ── SYMPTOM INTERVIEW FLOW ───────────────────────
        const iv = payload.interviewState;

        // CASE 1: No active interview, message has a symptom → START interview
        if ((!iv || !iv.active) && containsSymptom(message) && !shouldSkipInterview(message)) {
            const category = detectSymptomCategory(message);
            const firstQuestion = getNextQuestion(category, 0, language);

            let questionAudio = "";
            try {
                questionAudio = await murfTextToSpeech({ text: firstQuestion ?? "", language });
            } catch { /* non-fatal */ }

            return NextResponse.json({
                text: firstQuestion,
                audio: questionAudio,
                severity: "safe",
                intent: "symptom",
                transcript: message,
                responseType: "question" as const,
                interviewState: {
                    active: true,
                    category,
                    questionIndex: 1,
                    answers: [],
                } satisfies InterviewState,
            });
        }

        // CASE 2: Interview active, still have questions → ask NEXT
        if (iv?.active) {
            const totalQ = getTotalQuestions(iv.category as SymptomCategory);
            const updatedAnswers = [...(iv.answers ?? []), message];

            if (iv.questionIndex < totalQ) {
                const nextQ = getNextQuestion(iv.category as SymptomCategory, iv.questionIndex, language);

                let questionAudio = "";
                try {
                    questionAudio = await murfTextToSpeech({ text: nextQ ?? "", language });
                } catch { /* non-fatal */ }

                return NextResponse.json({
                    text: nextQ,
                    audio: questionAudio,
                    severity: "safe",
                    intent: "symptom",
                    transcript: message,
                    responseType: "question" as const,
                    interviewState: {
                        active: true,
                        category: iv.category,
                        questionIndex: iv.questionIndex + 1,
                        answers: updatedAnswers,
                    } satisfies InterviewState,
                });
            }

            // CASE 3: All questions answered → Build context → full advice
            const interviewContext = buildInterviewContext(
                iv.category as SymptomCategory,
                updatedAnswers,
            );

            const originalSymptom = iv.category as string;
            message = `Patient reported ${originalSymptom} symptoms. Interview details:\n${interviewContext}\n\nLatest answer: ${message}`;
        }

        // ── CHECK CACHE ──────────────────────────────────
        const key = cacheKey(message, language);
        const cached = getCached(key);
        if (cached && !iv?.active) {
            return NextResponse.json({
                ...cached,
                transcript: payload.message?.trim() ?? message,
                fromCache: true,
            });
        }

        // ── PARALLEL API CALLS ───────────────────────────
        const clinicInfo = nearestClinic(payload.lat, payload.lng) ?? (clinics as Clinic[])[0];
        const riskScore = calcRisk(payload.patientProfile, payload.symptomsTracker, payload.history);

        const [intent] = await Promise.all([
            classifyIntent(message),
            Promise.resolve(riskScore),
        ]);

        // Build context (sync, fast)
        let context = contextByIntent(intent, message);
        if (intent === "location" || intent === "emergency" || message.toLowerCase().includes("clinic")) {
            context += `\nRecommended Nearest Clinic to tell the user about: ${JSON.stringify(clinicInfo)}`;
        }

        const memoryStr = buildContext(payload.history);
        if (memoryStr) {
            context += `\n\nHere is the patient's recent history:\n${memoryStr}\nUse this to give more personalised responses.`;
        }

        if (payload.patientProfile) {
            const rules = payload.patientProfile;
            context += `\n\nPatient profile: Age ${rules.age}, Conditions: ${rules.chronicConditions?.join(", ") ?? "None"}.`;
        }

        // Severity classification
        let severity = await classifySeverity({ message, context, intent });

        // Tracker overrides
        const escalated = checkEscalation(message, payload.symptomsTracker);
        if (escalated) {
            if (severity === "safe") severity = "caution";
            else if (severity === "caution") severity = "urgent";
        }

        // ── LLM CALL (3-sentence response) ────────────────────
        const text = await generateHealthResponse({
            message,
            language,
            context,
            severity,
            intent,
            caretakerAge: payload.caretakerAge,
        });

        const clinic = (severity === "urgent" || intent === "location" || message.toLowerCase().includes("clinic")) ? clinicInfo : undefined;

        // ── TTS ───
        let audio = "";
        try {
            audio = await murfTextToSpeech({
                text,
                language,
                urgent: severity === "urgent",
            });
        } catch (ttsError) {
            console.error("Murf TTS non-fatal failure", ttsError);
        }

        // ── Build response ──────────────────────────────
        const isPostInterview = iv?.active && iv.questionIndex >= getTotalQuestions(iv.category as SymptomCategory);

        const responseData: Record<string, unknown> = {
            text,
            audio,
            severity,
            intent,
            clinic,
            transcript: payload.message?.trim() ?? message,
            riskScore,
            escalated,
            responseType: "advice" as const,
            ...(isPostInterview ? {
                interviewState: {
                    active: false,
                    category: "general",
                    questionIndex: 0,
                    answers: [],
                } satisfies InterviewState,
            } : {}),
        };

        // Cache the response
        if (!iv?.active) {
            setCache(key, responseData);
        }

        return NextResponse.json(responseData);
    } catch (error) {
        console.error("/api/voice failed", error);

        const message = error instanceof Error ? error.message : "";
        if (message.includes("Groq STT failed") || message.includes("Murf STT failed")) {
            return NextResponse.json(
                { error: "Voice transcription is unavailable right now. Please try again." },
                { status: 503 },
            );
        }

        if (message.includes("Timeout")) {
            return NextResponse.json(
                { error: "The request took too long. Please try again." },
                { status: 504 },
            );
        }

        return NextResponse.json(
            { error: "I am having a temporary issue right now. Please try again in a moment." },
            { status: 500 },
        );
    }
}
