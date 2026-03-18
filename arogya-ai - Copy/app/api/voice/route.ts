/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { classifyIntent, classifySeverity, generateHealthResponse, type HealthIntent } from "@/lib/groq";
import { murfSpeechToText, murfTextToSpeech } from "@/lib/murf";
import type { SupportedLanguage } from "@/prompts/health";
import { buildContext, type Message } from "@/lib/memory";
import { checkEmergencyRules } from "@/lib/rule-engine";
import { checkEscalation } from "@/lib/symptom-tracker";

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

function getRiskEmoji(severity: "safe" | "caution" | "urgent" | "critical"): string {
    if (severity === "safe") return "🟢 Low";
    if (severity === "caution") return "🟡 Moderate";
    return "🔴 High";
}

function parseSymptoms(message: string): string[] {
    return message
        .split(/[,.!?]| and /gi)
        .map((part) => part.trim())
        .filter((part) => part.length > 2)
        .slice(0, 5);
}

function ensureStructuredAssessment(input: {
    draftText: string;
    message: string;
    severity: "safe" | "caution" | "urgent" | "critical";
    clinic?: Clinic;
}): string {
    const draft = input.draftText?.trim() ?? "";
    const hasStructuredHeading = draft.includes("🩺 AI Health Assessment");
    const hasDisclaimer = draft.includes("This AI health assessment is for informational purposes only");

    if (hasStructuredHeading && hasDisclaimer) {
        return draft;
    }

    const symptoms = parseSymptoms(input.message);
    const symptomList = symptoms.length > 0 ? symptoms.map((item) => `- ${item}`).join("\n") : "- Not enough symptom detail provided";
    const urgent = input.severity === "urgent" || input.severity === "critical";
    const clinicLine = input.clinic
        ? `- Nearest clinic option: ${input.clinic.name}, ${input.clinic.district} (Timing: ${input.clinic.timing}, Phone: ${input.clinic.phone})`
        : "- Visit the nearest clinic/PHC for physical examination if symptoms continue";

    return `🩺 AI Health Assessment

Patient Symptoms:
${symptomList}

Possible Conditions:
- Possible causes may include viral infection, gastric irritation, stress-related symptoms, or other common illnesses.
- A proper clinical examination is needed to confirm the exact cause.

Risk Level:
${getRiskEmoji(input.severity)}

Recommended Actions:
- Rest, drink clean fluids, and monitor temperature/symptom changes every 4-6 hours.
- Avoid self-medication with prescription drugs.
- ${draft || "Follow supportive care and monitor for worsening symptoms."}

When to Seek Medical Attention:
- Seek immediate doctor care if breathing difficulty, chest pain, confusion, fainting, persistent vomiting, blood in vomit/stool, or very high fever occurs.
- ${urgent ? "Visit a doctor immediately." : "Visit a doctor soon if symptoms do not improve in 24-48 hours."}
${clinicLine}

Suggested Medical Tests:
- CBC, CRP/ESR, urine routine, and additional tests based on doctor evaluation.

Lifestyle & Recovery Advice:
- Stay hydrated, eat light meals, sleep adequately, and avoid exertion until recovery.
- Maintain hygiene and continue regular long-term medications only as advised by your doctor.

Disclaimer:
This AI health assessment is for informational purposes only and should not replace professional medical advice. Always consult a qualified healthcare provider for diagnosis or treatment.`;
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

        // F7: Emergency Rules FIRST
        const emergencyRule = checkEmergencyRules(message);
        if (emergencyRule) {
            const riskScore = calcRisk(payload.patientProfile, payload.symptomsTracker, payload.history);
            const emergencyClinic = nearestClinic(payload.lat, payload.lng) ?? (clinics as Clinic[])[0];
            const emergencySeverity = emergencyRule.severity === "high" ? "urgent" : emergencyRule.severity;
            const emergencyText = ensureStructuredAssessment({
                draftText: "Call emergency services (108) now and do not delay medical evaluation.",
                message,
                severity: emergencySeverity,
                clinic: emergencyClinic,
            });
            return NextResponse.json({
                text: emergencyText,
                audio: "", // Wait, TTS generated here or client? fallback to client or generate here.
                severity: emergencyRule.severity,
                intent: emergencyRule.action,
                clinic: emergencyClinic,
                transcript: message,
                riskScore
            });
        }

        const intent = await classifyIntent(message);
        const clinicInfo = nearestClinic(payload.lat, payload.lng) ?? (clinics as Clinic[])[0];

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
            context += `\n\nPatient profile: Age ${rules.age}, Conditions: ${rules.chronicConditions?.join(", ") ?? "None"}. Personalise your response accordingly.`;
        }

        let severity = await classifySeverity({ message, context, intent });

        // F10: Tracker overrides
        const escalated = checkEscalation(message, payload.symptomsTracker);
        if (escalated) {
            if (severity === "safe") severity = "caution";
            else if (severity === "caution") severity = "urgent";
        }

        const rawText = await generateHealthResponse({
            message,
            language,
            context,
            severity,
            intent,
        });

        const clinic = (severity === "urgent" || intent === "location" || message.toLowerCase().includes("clinic")) ? clinicInfo : undefined;
        const text = ensureStructuredAssessment({
            draftText: rawText,
            message,
            severity,
            clinic,
        });

        let audio = "";
        try {
            audio = await murfTextToSpeech({ text, language });
        } catch (ttsError) {
            console.error("Murf TTS non-fatal failure", ttsError);
        }

        // F6: Risk score
        const riskScore = calcRisk(payload.patientProfile, payload.symptomsTracker, payload.history);

        return NextResponse.json({
            text,
            audio,
            severity,
            intent,
            clinic,
            transcript: message,
            riskScore,
            escalated
        });
    } catch (error) {
        console.error("/api/voice failed", error);

        const message = error instanceof Error ? error.message : "";
        if (message.includes("Groq STT failed") || message.includes("Murf STT failed")) {
            return NextResponse.json(
                {
                    error: "Voice transcription is unavailable right now. Please try again in a quieter place or try once more.",
                },
                { status: 503 },
            );
        }

        return NextResponse.json(
            {
                error:
                    "I am having a temporary issue right now. Please try again in a moment.",
            },
            { status: 500 },
        );
    }
}
