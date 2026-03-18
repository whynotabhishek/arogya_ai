"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cross, Languages, LoaderCircle, Pill, BarChart2 } from "lucide-react";
import type { SupportedLanguage } from "@/prompts/health";
import { STRINGS, LANGUAGE_LABELS } from "@/lib/i18n";

import { ResponseCard } from "@/components/ResponseCard";
import { ClinicFinder } from "@/components/ClinicFinder";
import { useSession, signIn, signOut } from "next-auth/react";
import { saveMessage, getHistory, type Message } from "@/lib/memory";
import { VoiceWaveform } from "@/components/VoiceWaveform";
import { RayBackground, ChatInput, ImportButtons, AnnouncementBadge } from "@/components/ui/arogya-chat";
import { ProfileSetup } from "@/components/ProfileSetup";
import { getPatientProfile, type PatientProfile } from "@/lib/patient-profile";
import { getStoredRiskScore, getRiskLevel, saveRiskScore } from "@/lib/risk-engine";
import { getClientSymptomsTracker, trackSymptom } from "@/lib/symptom-tracker";
import { vibrateSuccess, vibrateWarning, vibrateEmergency } from "@/lib/haptics";
import { scheduleMedicineReminder } from "@/lib/medicine-reminder";

type ChatRole = "user" | "assistant";

type ChatMessage = {
    id: string;
    role: ChatRole;
    text: string;
    audio?: string;
};

type VoiceResponse = {
    text: string;
    audio: string;
    severity: "safe" | "caution" | "urgent" | "critical";
    intent: string;
    clinic?: {
        name: string;
        district: string;
        timing: string;
        phone: string;
    };
    transcript?: string;
    error?: string;
    riskScore?: number;
    escalated?: boolean;
};

type ScanResponse = {
    text?: string;
    audio?: string;
    severity?: "safe" | "caution" | "urgent" | "critical";
    error?: string;
};

type MainScreenProps = {
    language: SupportedLanguage;
    onLanguageSwitch: () => void;
};

type VoiceApiRequest = {
    language: SupportedLanguage;
    mimeType?: string;
    audioBase64?: string;
    message?: string;
    lat?: number;
    lng?: number;
    history?: Message[];
};

type SpeechRecognitionLike = {
    lang: string;
    interimResults: boolean;
    maxAlternatives: number;
    onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
    onerror: ((event: { error: string }) => void) | null;
    onend: (() => void) | null;
    start: () => void;
    stop: () => void;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
    const windowWithSpeech = window as Window & {
        webkitSpeechRecognition?: SpeechRecognitionCtor;
        SpeechRecognition?: SpeechRecognitionCtor;
    };
    return windowWithSpeech.SpeechRecognition ?? windowWithSpeech.webkitSpeechRecognition ?? null;
}

async function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result;
            if (typeof result !== "string") {
                reject(new Error("Unable to read audio"));
                return;
            }
            const base64 = result.split(",")[1] ?? "";
            resolve(base64);
        };
        reader.onerror = () => reject(new Error("Unable to read audio"));
        reader.readAsDataURL(blob);
    });
}

export function MainScreen({ language, onLanguageSwitch }: MainScreenProps) {
    const t = useMemo(() => STRINGS[language], [language]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isListening, setIsListening] = useState(false);
    const [isVoiceLoading, setIsVoiceLoading] = useState(false);
    const [isScanLoading, setIsScanLoading] = useState(false);
    const [cardOpen, setCardOpen] = useState(false);
    const [toast, setToast] = useState<string | null>(null);
    const [cardText, setCardText] = useState("");
    const [cardSeverity, setCardSeverity] = useState<"safe" | "caution" | "urgent" | "critical">("safe");
    const [cardClinic, setCardClinic] = useState<VoiceResponse["clinic"] | undefined>(undefined);

    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | undefined>(undefined);
    const [localUserImage, setLocalUserImage] = useState<string | null>(null);
    const [hasMemory, setHasMemory] = useState(false);

    // Feature states
    const [showProfileSetup, setShowProfileSetup] = useState(false);
    const [userProfile, setUserProfile] = useState<PatientProfile | null>(null);
    const [riskScore, setRiskScore] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const speechRecognitionRef = useRef<SpeechRecognitionLike | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const latestAudioRef = useRef<string>("");
    const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const chatRef = useRef<HTMLDivElement | null>(null);

    const { data: session } = useSession();

    const [activeStream, setActiveStream] = useState<MediaStream | null>(null);

    useEffect(() => {


        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                () => console.log("Location access denied or unavailable.")
            );
        }

        const storedAvatar = localStorage.getItem("arogya-user-avatar");
        if (storedAvatar) {
            setLocalUserImage(storedAvatar);
        }

        if (getHistory().length > 0) {
            setHasMemory(true);
        }

        const profile = getPatientProfile();
        if (profile) {
            setUserProfile(profile);
        } else {
            setShowProfileSetup(true);
        }

        setRiskScore(getStoredRiskScore());

        // Handle incoming initial query from landing page
        const pendingQuery = localStorage.getItem('arogya_initial_query');
        if (pendingQuery && pendingQuery.trim() !== '') {
            // Give a slight delay to allow UI to mount properly before fetching
            setTimeout(() => {
                submitVoice({ message: pendingQuery, language });
                localStorage.removeItem('arogya_initial_query');
            }, 500);
        } else if (pendingQuery === '') {
            // Trigger voice flow immediately if empty
            setTimeout(() => {
                toggleRecording();
                localStorage.removeItem('arogya_initial_query');
            }, 500);
        }

        const pendingAction = localStorage.getItem('arogya_initial_action');
        if (pendingAction === 'medicine') {
            setTimeout(() => {
                onPickMedicineImage();
                localStorage.removeItem('arogya_initial_action');
            }, 500);
        } else if (pendingAction === 'clinic') {
            setTimeout(() => {
                // To auto-trigger clinic finder we would do something here, 
                // but since it's just scrolling, maybe just focus it.
                // For now, let's just let it load the assistant page.
                localStorage.removeItem('arogya_initial_action');
            }, 500);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [language]);

    useEffect(() => {
        if (!chatRef.current) return;
        chatRef.current.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
    }, [messages, isVoiceLoading]);

    const displayUserImage = session?.user?.image || localUserImage || "";

    const pushMessage = (role: ChatRole, text: string, audio?: string) => {
        saveMessage(role, text, language);
        setHasMemory(true);
        setMessages((prev) => [...prev, { id: `${role}-${Date.now()}-${Math.random()}`, role, text, audio }]);
    };

    const playAudio = (audio: string) => {
        if (!audio) return;
        if (!audioRef.current) {
            audioRef.current = new Audio();
        }
        audioRef.current.src = audio.startsWith("http") ? audio : `data:audio/mp3;base64,${audio}`;
        void audioRef.current.play();
    };

    const showToast = (message: string) => {
        setToast(message);
        if (toastTimerRef.current) {
            clearTimeout(toastTimerRef.current);
        }
        toastTimerRef.current = setTimeout(() => setToast(null), 2400);
    };

    const submitVoice = async (requestPayload: VoiceApiRequest) => {
        try {
            setIsVoiceLoading(true);
            const payloadWithLocation = {
                ...requestPayload,
                lat: userLocation?.lat,
                lng: userLocation?.lng,
                history: getHistory(),
                patientProfile: userProfile,
                symptomsTracker: getClientSymptomsTracker()
            };

            const response = await fetch("/api/voice", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payloadWithLocation),
            });

            const payload = (await response.json()) as VoiceResponse;
            if (!response.ok || !payload.text) {
                throw new Error(payload.error || "Unable to answer now.");
            }

            if (payload.transcript) {
                pushMessage("user", payload.transcript);
            }
            pushMessage("assistant", payload.text, payload.audio);

            latestAudioRef.current = payload.audio;

            // F10 tracking and F6 riskScore
            if (payload.transcript && payload.severity) {
                trackSymptom(payload.transcript, payload.severity);
            }
            if (payload.riskScore !== undefined) {
                saveRiskScore(payload.riskScore);
                setRiskScore(payload.riskScore);
            }

            // F14 Haptics
            if (payload.escalated || payload.severity === "critical" || payload.severity === "urgent") {
                vibrateEmergency();
            } else if (payload.severity === "caution") {
                vibrateWarning();
            } else {
                vibrateSuccess();
            }

            setCardText(payload.text);
            setCardSeverity(payload.severity);
            setCardClinic(payload.clinic);
            setCardOpen(true);
            // autoplay managed by DOM <audio autoPlay> component
        } catch {
            const userMessage =
                language === "kannada"
                    ? "ಕ್ಷಮಿಸಿ, ಈಗ ಉತ್ತರಿಸಲು ಆಗಲಿಲ್ಲ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ."
                    : language === "hindi"
                        ? "माफ कीजिए, अभी जवाब नहीं दे पा रहा हूँ। फिर कोशिश करें।"
                        : language === "telugu"
                            ? "క్షమించండి, నేను ఇప్పుడు సమాధానం ఇవ్వలేను. దయచేసి మళ్ళీ ప్రయత్నించండి."
                            : "Sorry, I could not respond right now. Please try again.";
            pushMessage("assistant", userMessage);
            setCardText(userMessage);
            setCardSeverity("caution");
            setCardClinic(undefined);
            setCardOpen(true);
        } finally {
            setIsVoiceLoading(false);
        }
    };

    const submitScan = async (imageBase64: string, mimeType: string) => {
        try {
            setIsScanLoading(true);
            const response = await fetch("/api/scan", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageBase64, mimeType, language }),
            });

            const payload = (await response.json()) as ScanResponse;
            if (!response.ok || !payload.text) {
                throw new Error(payload.error || "Unable to scan this image right now.");
            }

            pushMessage("assistant", payload.text, payload.audio);
            latestAudioRef.current = payload.audio ?? "";
            setCardText(payload.text);
            setCardSeverity(payload.severity ?? "caution");
            setCardClinic(undefined);
            setCardOpen(true);

            vibrateSuccess();

            // F9 Medicine reminder trigger
            const textLower = payload.text?.toLowerCase() || "";
            if (textLower.includes("dosage") || textLower.includes("hours") || textLower.includes("goli") || textLower.includes("pill") || textLower.includes("take")) {
                const wantsReminder = window.confirm(`Arogya AI: Set a reminder for this medicine?`);
                if (wantsReminder) {
                    scheduleMedicineReminder("Prescribed Medicine", 8, language);
                    showToast("Reminder set for every 8 hours");
                }
            }
        } catch {
            const friendly =
                language === "kannada"
                    ? "ಚಿತ್ರ ಸ್ಪಷ್ಟವಾಗಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಸ್ಪಷ್ಟವಾದ ಫೋಟೋ ನೀಡಿ."
                    : language === "hindi"
                        ? "तस्वीर साफ़ नहीं है। कृपया एक और साफ़ फोटो दें।"
                        : language === "telugu"
                            ? "చిత్రం స్పష్టంగా లేదు. దయచేసి మరొక స్పష్టమైన ఫోటోను ప్రయత్నించండి."
                            : "Image is not clear enough. Please try another clear medicine photo.";
            pushMessage("assistant", friendly);
            setCardText(friendly);
            setCardSeverity("caution");
            setCardOpen(true);
        } finally {
            setIsScanLoading(false);
        }
    };

    const startRecording = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });

        streamRef.current = stream;
        setActiveStream(stream);
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) chunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = async () => {
            const blob = new Blob(chunksRef.current, { type: "audio/webm" });
            const base64 = await blobToBase64(blob);
            await submitVoice({
                audioBase64: base64,
                mimeType: "audio/webm",
                language,
            });
            streamRef.current?.getTracks().forEach((track) => track.stop());
            setActiveStream(null);
        };

        mediaRecorder.start();
    };

    const toggleRecording = async () => {
        try {
            if (!isListening) {
                setIsListening(true);

                const SpeechCtor = getSpeechRecognitionCtor();
                if (SpeechCtor) {
                    const recognition = new SpeechCtor();
                    speechRecognitionRef.current = recognition;
                    recognition.lang = language === "kannada" ? "kn-IN" : language === "hindi" ? "hi-IN" : language === "telugu" ? "te-IN" : "en-IN";
                    recognition.interimResults = false;
                    recognition.maxAlternatives = 1;

                    recognition.onresult = async (event) => {
                        const transcript = event.results[0]?.[0]?.transcript?.trim();
                        if (!transcript) return;
                        await submitVoice({ message: transcript, language });
                    };

                    recognition.onerror = () => {
                        setCardText(
                            language === "kannada"
                                ? "ಧ್ವನಿ ಕೇಳಿಸಲಿಲ್ಲ. ಮತ್ತೆ ನಿಧಾನವಾಗಿ ಮಾತನಾಡಿ."
                                : language === "hindi"
                                    ? "आवाज़ साफ़ नहीं आई। कृपया फिर बोलें।"
                                    : language === "telugu"
                                        ? "వాయిస్ సరిగ్గా వినపడలేదు. దయచేసి మళ్ళీ చెప్పండి."
                                        : "I could not catch that clearly. Please speak once more.",
                        );
                        setCardSeverity("caution");
                        setCardOpen(true);
                    };

                    recognition.onend = () => {
                        setIsListening(false);
                    };

                    recognition.start();
                    return;
                }

                await startRecording();
            } else {
                setIsListening(false);
                speechRecognitionRef.current?.stop();
                mediaRecorderRef.current?.stop();
            }
        } catch {
            setCardText(
                language === "kannada"
                    ? "ಮೈಕ್ ಅನುಮತಿ ನೀಡಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ."
                    : language === "hindi"
                        ? "माइक अनुमति दें और फिर कोशिश करें।"
                        : language === "telugu"
                            ? "దయచేసి మైక్ అనుమతి ఇవ్వండి మరియు మళ్ళీ ప్రయత్నించండి."
                            : "Please allow microphone permission and try again.",
            );
            setCardSeverity("caution");
            setCardOpen(true);
            setIsListening(false);
        }
    };

    const onPickMedicineImage = () => {
        fileInputRef.current?.click();
    };

    const onFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const fileReader = new FileReader();
        fileReader.onload = async () => {
            const result = fileReader.result;
            if (typeof result !== "string") return;
            const imageBase64 = result.split(",")[1] ?? "";
            await submitScan(imageBase64, file.type || "image/jpeg");
        };
        fileReader.readAsDataURL(file);

        event.target.value = "";
    };

    const severityLabel =
        cardSeverity === "safe" ? t.safe : cardSeverity === "caution" ? t.caution : t.urgent;

    const sharePrescription = () => {
        if (messages.length === 0) {
            showToast(t.noConversationError);
            return;
        }

        const doctorMessages = messages.filter(m => m.role === "assistant").map(m => m.text);
        let summaryText = "";

        if (doctorMessages.length > 0) {
            summaryText = doctorMessages[doctorMessages.length - 1];
        } else {
            summaryText = t.noConversationError; // fallback
        }

        import("@/lib/share").then(m => m.shareOnWhatsApp(summaryText, language));
    };

    const downloadPrescription = () => {
        if (messages.length === 0) {
            showToast(t.noConversationError);
            return;
        }

        const patientName = session?.user?.name || "Guest Patient";

        let content = `=================================================\n`;
        content += `               ${t.summaryHeader}               \n`;
        content += `=================================================\n\n`;
        content += `Physician: Dr. Arogya (AI Health Assistant)\n`;
        content += `Patient Name: ${patientName}\n`;
        content += `Date: ${new Date().toLocaleDateString()}  Time: ${new Date().toLocaleTimeString()}\n`;
        content += `Language: ${LANGUAGE_LABELS[language]}\n`;
        content += `-------------------------------------------------\n\n`;

        content += `[ CHIEF COMPLAINTS / SYMPTOMS ]\n`;

        const userMessages = messages.filter(m => m.role === "user").map(m => m.text);
        if (userMessages.length > 0) {
            userMessages.forEach((msg, i) => {
                content += `* ${msg}\n`;
            });
        } else {
            content += `* None recorded directly.\n`;
        }

        content += `\n-------------------------------------------------\n`;
        content += `[ DOCTOR'S ADVICE / RX ]\n`;

        const doctorMessages = messages.filter(m => m.role === "assistant").map(m => m.text);
        if (doctorMessages.length > 0) {
            const lastAdvice = doctorMessages[doctorMessages.length - 1]; // latest context
            content += `\n${lastAdvice}\n`;
        }

        content += `\n-------------------------------------------------\n`;
        content += `[ ${t.importantNotice} ]\n`;
        content += `${t.disclaimer}\n\n`;
        content += `=================================================\n`;
        content += `         Powered by Arogya AI & Groq Llama 3     \n`;
        content += `=================================================\n`;

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Dr_Arogya_Prescription_${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <section className={`relative flex flex-col items-center justify-center min-h-screen w-full overflow-hidden bg-[#060A14] font-sans text-white selection:bg-[#FF8C00]/20`}>
            <RayBackground />

            {/* Hidden Input for Medicine Scanner */}
            <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={onFileSelected} />

            {/* Profile Setup Modal */}
            <AnimatePresence>
                {showProfileSetup && (
                    <ProfileSetup
                        language={language}
                        initialProfile={userProfile}
                        initialAvatar={localUserImage}
                        onProfileSaved={(profile, avatar) => {
                            setUserProfile(profile);
                            if (avatar) {
                                setLocalUserImage(avatar);
                            }
                        }}
                        onComplete={() => {
                            setShowProfileSetup(false);
                            const p = getPatientProfile();
                            if (p) setUserProfile(p);
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Top Navbar */}
            <div className="absolute top-[30px] sm:top-[40px] z-50 flex w-full justify-between items-center px-4 sm:px-6">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onLanguageSwitch}
                        className="inline-flex min-h-[36px] items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white hover:bg-white/10 hover:border-white/20 transition-all shadow-sm"
                    >
                        <Languages className="h-3.5 w-3.5 text-white/70" />
                        <span>{LANGUAGE_LABELS[language]}</span>
                    </button>
                    <a
                        href="/dashboard"
                        className="inline-flex min-h-[36px] items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white hover:bg-white/10 hover:border-white/20 transition-all shadow-sm no-underline"
                    >
                        <BarChart2 className="h-3.5 w-3.5 text-white/70" />
                        <span>{language === 'kannada' ? 'ಡ್ಯಾಶ್ಬೋರ್ಡ್' : 'Dashboard'}</span>
                    </a>
                    {hasMemory && (
                        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            </span>
                            <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400">Memory active</span>
                        </div>
                    )}
                </div>

                <div className="flex flex-col items-center pointer-events-none absolute left-1/2 -translate-x-1/2">
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold tracking-tight text-white/90">Arogya AI</h1>
                        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-white/5" title={`Risk Score: ${riskScore}`}>
                            <span className={`h-2 w-2 rounded-full ${getRiskLevel(riskScore) === "critical" ? "bg-red-500 animate-pulse" :
                                    getRiskLevel(riskScore) === "high" ? "bg-orange-500 animate-pulse" :
                                        getRiskLevel(riskScore) === "moderate" ? "bg-amber-500" :
                                            "bg-emerald-500"
                                }`} />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                    <button
                        onClick={sharePrescription}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#25D366]/30 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors"
                        title="Share via WhatsApp"
                    >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766 0 1.011.266 1.996.772 2.87l-.824 3.003 3.078-.809a5.728 5.728 0 002.742.695h.001c3.181 0 5.768-2.586 5.768-5.766 0-3.181-2.587-5.767-5.769-5.767zm3.178 8.019c-.174.492-.93.931-1.311.97-.348.035-.8.113-2.315-.515-1.831-.762-3.008-2.637-3.098-2.757-.09-.12-.738-.985-.738-1.879s.467-1.348.63-1.53c.163-.182.353-.228.473-.228.12 0 .24.001.345.006.111.005.26-.041.4.298.15.362.51.1246.56.1368.045.12.045.285-.09.435-.135.15-.27.315-.39.42-.135.12-.275.255-.135.495.14.24.625 1.031 1.345 1.676.929.831 1.705 1.091 1.945 1.211.24.12.38.09.52-.075.14-.165.61-.72.77-.975.16-.255.32-.21.545-.12.23.09 1.43.675 1.67.795.24.12.4.18.46.285.06.105.06.615-.114 1.107z" />
                            <path d="M12.031 2C6.48 2 1.983 6.496 1.983 12.047c0 1.772.463 3.501 1.342 5.027L2 22l5.068-1.328a10.038 10.038 0 004.963 1.32h.004C17.58 21.992 22 17.502 22 11.95 22 6.398 17.582 2 12.031 2zm0 18.337h-.002c-1.5 0-2.97-.404-4.256-1.167l-.304-.18-3.164.83.843-3.084-.198-.315A8.324 8.324 0 013.639 12.05c0-4.636 3.774-8.411 8.392-8.411 4.618 0 8.394 3.775 8.394 8.411 0 4.636-3.775 8.411-8.394 8.411z" />
                        </svg>
                    </button>
                    {session?.user || userProfile ? (
                        <div className="flex items-center gap-2">
                            {displayUserImage ? (
                                <img src={displayUserImage} alt={session?.user?.name || userProfile?.name || "User"} className="h-7 w-7 rounded-full ring-2 ring-white/10 object-cover" />
                            ) : (
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white text-xs font-bold ring-1 ring-white/20">
                                    {userProfile?.name?.substring(0, 2)?.toUpperCase() || "GU"}
                                </div>
                            )}
                            {session?.user && (
                                <button onClick={() => signOut()} className="hidden sm:block text-[10px] font-bold text-white/40 hover:text-red-400 transition-colors uppercase tracking-wider bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-full">
                                    Logout
                                </button>
                            )}
                        </div>
                    ) : (
                        <button
                            onClick={() => signIn("google")}
                            className="text-xs font-bold text-white transition-colors tracking-wide bg-white/10 hover:bg-white/20 px-4 py-1.5 rounded-full flex items-center gap-2 shadow-sm border border-white/10"
                        >
                            <svg className="h-3 w-3" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="currentColor" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor" />
                            </svg>
                            <span className="hidden sm:inline">Sign In</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="absolute top-[85px] sm:top-[90px] left-1/2 -translate-x-1/2 flex flex-col items-center justify-between w-full h-[calc(100vh-100px)] overflow-hidden px-4 z-10 pb-4">

                {/* Scrollable Message List */}
                <div ref={chatRef} className="flex-1 w-full max-w-[700px] overflow-y-auto mb-6 mt-4 px-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center w-full h-full pb-20 pt-16 mt-16 mt-[-100px] sm:mt-0 lg:pt-0">
                            <div className="mb-8">
                                <AnnouncementBadge text="Powered by Murf Falcon · <130ms Voice" />
                            </div>
                            <div className="text-center">
                                <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>
                                    {language === 'kannada' ? 'ನಿಮ್ಮ ಆರೋಗ್ಯ ಸಮಸ್ಯೆ' : language === 'hindi' ? 'अपनी स्वास्थ्य समस्या' : language === 'english' ? 'Your health issue' : 'మీ ఆరోగ్య సమస్య'}{' '}
                                    <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#FF8C00] to-white italic">
                                        {language === 'kannada' ? 'ಹೇಳಿ' : language === 'hindi' ? 'बताएं' : language === 'english' ? 'Tell' : 'చెప్పండి'}
                                    </span><br className="sm:hidden" /> · Ask now
                                </h1>
                                <p className="text-base font-semibold sm:text-lg text-[rgba(255,255,255,0.4)] whitespace-pre-line leading-relaxed max-w-[500px] mx-auto mt-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                                    Speak in Kannada, Hindi, or English.
                                    <br />No typing required.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-6 py-6 w-full mb-8">
                            {messages.map((message) => (
                                <motion.div
                                    key={message.id}
                                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                    className={`flex items-end gap-3 w-full ${message.role === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    {message.role === "assistant" && (
                                        <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-b from-[#FF8C00] to-[#E85D00] flex items-center justify-center p-[1.5px] shadow-lg">
                                            <div className="bg-[#060A14] w-full h-full rounded-full flex items-center justify-center">
                                                <Cross className="h-4 w-4 text-[#FF8C00]" />
                                            </div>
                                        </div>
                                    )}
                                    <div className={`max-w-[85%] sm:max-w-[75%] px-5 py-4 text-[15px] leading-relaxed shadow-lg flex flex-col gap-2 ${message.role === "user"
                                            ? "rounded-[24px_24px_4px_24px] bg-gradient-to-br from-[#1a2333] to-[#0D1525] border border-white/5 font-medium text-white/90"
                                            : "rounded-[24px_24px_24px_4px] bg-[rgba(13,21,37,0.7)] backdrop-blur-md border border-white/10 text-white/90"
                                        }`}>
                                        <div>{message.text}</div>
                                        {message.audio && (
                                            <audio
                                                controls
                                                autoPlay
                                                src={message.audio.startsWith("http") ? message.audio : `data:audio/mp3;base64,${message.audio}`}
                                                className="w-full h-[40px] mt-1 opacity-90 sepia-[20%] hue-rotate-180 invert-[80%]"
                                            />
                                        )}
                                    </div>
                                    {message.role === "user" && displayUserImage && (
                                        <div className="h-8 w-8 shrink-0 rounded-full ring-1 ring-white/20 overflow-hidden shadow-lg">
                                            <img src={displayUserImage} alt="User" className="h-full w-full object-cover" />
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                            {isVoiceLoading && (
                                <div className="flex items-end gap-3 w-full justify-start mt-4">
                                    <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-b from-[#FF8C00] to-[#E85D00] flex items-center justify-center p-[1.5px] shadow-lg animate-pulse">
                                        <div className="bg-[#060A14] w-full h-full rounded-full flex items-center justify-center">
                                            <Cross className="h-4 w-4 text-[#FF8C00]" />
                                        </div>
                                    </div>
                                    <div className="rounded-[24px_24px_24px_4px] bg-[rgba(13,21,37,0.7)] backdrop-blur-md border border-white/10 px-5 py-4">
                                        <LoaderCircle className="h-5 w-5 text-[#FF8C00] animate-spin" />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="w-full max-w-[700px] shrink-0 relative z-30">
                    <div className="absolute bottom-full left-0 right-0 mb-4 flex justify-center pointer-events-none z-50">
                        <VoiceWaveform isListening={isListening} isProcessing={isVoiceLoading} stream={activeStream} />
                    </div>
                    <ChatInput
                        isListening={false}
                        onOptionClick={(id) => {
                            if (id === 'medicine') onPickMedicineImage();
                            if (id === 'clinic') document.getElementById('clinic-finder-btn')?.click();
                            if (id === 'profile') setShowProfileSetup(true);
                        }}
                        placeholder="ನಿಮ್ಮ ಆರೋಗ್ಯ ಸಮಸ್ಯೆ ಹೇಳಿ..."
                        getPayload={() => ({
                            lat: userLocation?.lat,
                            lng: userLocation?.lng,
                            history: getHistory(),
                            patientProfile: userProfile,
                            symptomsTracker: getClientSymptomsTracker()
                        })}
                        onVoiceResponse={(payload: VoiceResponse) => {
                            if (payload.transcript) {
                                pushMessage("user", payload.transcript);
                            }
                            if (payload.text) {
                                pushMessage("assistant", payload.text, payload.audio);
                            }
                            if (payload.audio) {
                                latestAudioRef.current = payload.audio;
                            }
                            if (payload.transcript && payload.severity) {
                                trackSymptom(payload.transcript, payload.severity);
                            }
                            if (payload.riskScore !== undefined) {
                                saveRiskScore(payload.riskScore);
                                setRiskScore(payload.riskScore);
                            }
                            if (payload.escalated || payload.severity === "critical" || payload.severity === "urgent") {
                                vibrateEmergency();
                            } else if (payload.severity === "caution") {
                                vibrateWarning();
                            } else {
                                vibrateSuccess();
                            }
                            setCardText(payload.text || "");
                            setCardSeverity(payload.severity || "safe");
                            setCardClinic(payload.clinic);
                            setCardOpen(true);
                        }}
                        onSend={(text) => {
                            if (!audioRef.current) {
                                audioRef.current = new Audio();
                                audioRef.current.play().catch(() => { });
                            }
                            if (text && text.trim().length > 0) {
                                submitVoice({ message: text, language });
                            }
                        }}
                    />

                    <div className="flex items-center justify-center gap-4 mt-6">
                        {messages.length === 0 ? (
                            <ImportButtons
                                onImport={(id) => {
                                    if (id === 'medicine') onPickMedicineImage();
                                    if (id === 'clinic') document.getElementById('clinic-finder-btn')?.click();
                                }}
                            />
                        ) : (
                            <div className="flex gap-3">
                                <button
                                    onClick={downloadPrescription}
                                    className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-[#060A14] hover:bg-[#0D1525] text-xs font-medium text-white/60 hover:text-white transition-all"
                                >
                                    Download Prescription
                                </button>
                                <button
                                    onClick={() => onPickMedicineImage()}
                                    className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-[#060A14] hover:bg-[#0D1525] text-xs font-medium text-white/60 hover:text-white transition-all"
                                >
                                    <Pill className="h-3.5 w-3.5" />
                                    Scan Medicine
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {toast && (
                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 14 }}
                    className="fixed left-1/2 top-4 z-[70] w-[92%] max-w-sm -translate-x-1/2 rounded-full border border-white/10 bg-[rgba(13,21,37,0.9)] px-5 py-3 text-center text-sm font-semibold text-white/90 shadow-2xl backdrop-blur-xl"
                >
                    {toast}
                </motion.div>
            )}

            {isScanLoading && (
                <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#060A14] backdrop-blur-sm">
                    <div className="relative flex flex-col items-center">
                        <div className="absolute h-32 w-32 rounded-full bg-[#FF8C00]/20 animate-pulse blur-xl" />
                        <div className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full border-4 border-white/5 border-t-[#FF8C00] shadow-[0_8px_30px_rgba(255,140,0,0.2)]">
                            <LoaderCircle className="absolute h-16 w-16 animate-spin text-[#FF8C00]" />
                            <Pill className="h-6 w-6 text-white" />
                        </div>
                        <p className="mt-8 text-base font-bold tracking-wide text-white">{t.scanning}</p>
                        <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-white/40">{t.analyzingMedicine}</p>
                    </div>
                </div>
            )}

            <ResponseCard
                open={cardOpen}
                text={cardText}
                severity={cardSeverity}
                severityLabel={severityLabel}
                replayLabel={t.replay}
                clinic={cardClinic}
                onReplay={() => playAudio(latestAudioRef.current)}
                onClose={() => setCardOpen(false)}
            />

            {/* Keeping components that hold logic visually hidden but accessible to DOM clicks */}
            <div className="opacity-0 pointer-events-none absolute w-[1px] h-[1px] overflow-hidden">
                <ClinicFinder
                    label={t.clinic} sublabel="" permissionDeniedLabel="" onClinicFound={(clinic) => {
                        const text =
                            language === "kannada"
                                ? `ಹತ್ತಿರದ ಕೇಂದ್ರ: ${clinic.name}, ${clinic.district}. ಸಮಯ: ${clinic.timing}.`
                                : language === "hindi"
                                    ? `नजदीकी केंद्र: ${clinic.name}, ${clinic.district}. समय: ${clinic.timing}.`
                                    : language === "telugu"
                                        ? `దగ్గరి క్లినిక్: ${clinic.name}, ${clinic.district}. సమయం: ${clinic.timing}.`
                                        : `Nearest clinic: ${clinic.name}, ${clinic.district}. Timing: ${clinic.timing}.`;
                        pushMessage("assistant", text);
                        setCardText(text);
                        setCardSeverity("safe");
                        setCardClinic(clinic);
                        setCardOpen(true);
                    }} onFriendlyError={(message) => {
                        setCardText(message);
                        setCardSeverity("caution");
                        setCardOpen(true);
                    }}
                />
            </div>
        </section>
    );
}
