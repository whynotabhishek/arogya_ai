"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { Cross, Languages, LoaderCircle, Pill, BarChart2, Phone, MapPin, Lightbulb } from "lucide-react";
import type { SupportedLanguage } from "@/prompts/health";
import { LANGUAGE_LABELS } from "@/lib/i18n";
import { t as tr, type Language } from "@/lib/translations";
import { type InterviewState, DEFAULT_INTERVIEW_STATE, getTotalQuestions, type SymptomCategory } from "@/lib/symptom-interview";
import { getTodaysTip } from "@/lib/daily-tip";

import { ResponseCard } from "@/components/ResponseCard";
import { ClinicFinder } from "@/components/ClinicFinder";
import { SymptomMCQ, type SymptomMCQCategory } from "@/components/SymptomMCQ";
import { BodyMap, regionLabels, type BodyRegion } from "@/components/BodyMap";
import { CaretakerToggle } from "@/components/CaretakerToggle";
import { useSession, signIn, signOut } from "next-auth/react";
import { saveMessage, getHistory, type Message } from "@/lib/memory";
import { VoiceWaveform } from "@/components/VoiceWaveform";
import { RayBackground, ChatInput, ImportButtons, AnnouncementBadge } from "@/components/ui/arogya-chat";
import { ProfileSetup } from "@/components/ProfileSetup";
import { getPatientProfile, type PatientProfile } from "@/lib/patient-profile";
import { getStoredRiskScore, getRiskLevel, saveRiskScore } from "@/lib/risk-engine";
import { getClientSymptomsTracker, trackSymptom } from "@/lib/symptom-tracker";
import { vibrateSuccess, vibrateWarning, vibrateEmergency, vibrateTap } from "@/lib/haptics";
import { scheduleMedicineReminder } from "@/lib/medicine-reminder";
import { shareOnWhatsApp } from "@/lib/share";

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
        lat?: number;
        lng?: number;
    };
    transcript?: string;
    error?: string;
    riskScore?: number;
    escalated?: boolean;
    responseType?: "question" | "advice";
    interviewState?: InterviewState;
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
    caretakerAge?: number;
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
    const lang = language as Language;
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

    // Symptom Interview state
    const [interviewState, setInterviewState] = useState<InterviewState>(DEFAULT_INTERVIEW_STATE);

    // New feature states
    const [showBodyMap, setShowBodyMap] = useState(false);
    const [showMCQ, setShowMCQ] = useState(false);
    const [mcqCategory, setMcqCategory] = useState<SymptomMCQCategory>("headache");
    const [caretakerActive, setCaretakerActive] = useState(false);
    const [caretakerAge, setCaretakerAge] = useState(30);

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

    // Auto greeting on first session
    useEffect(() => {
        if (typeof window === "undefined") return;
        const greeted = sessionStorage.getItem("arogya_greeted");
        if (!greeted) {
            sessionStorage.setItem("arogya_greeted", "true");
            // Play greeting after mount
            const greetingText = tr("greeting", lang);
            pushMessage("assistant", greetingText);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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

        // Caretaker mode from localStorage
        try {
            const ct = localStorage.getItem("arogya_caretaker");
            if (ct) {
                const data = JSON.parse(ct);
                setCaretakerActive(data.active || false);
                setCaretakerAge(data.age || 30);
            }
        } catch { /* ignore */ }

        // Handle incoming initial query from landing page
        const pendingQuery = localStorage.getItem('arogya_initial_query');
        if (pendingQuery && pendingQuery.trim() !== '') {
            setTimeout(() => {
                submitVoice({ message: pendingQuery, language });
                localStorage.removeItem('arogya_initial_query');
            }, 500);
        } else if (pendingQuery === '') {
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
                symptomsTracker: getClientSymptomsTracker(),
                interviewState,
                caretakerAge: caretakerActive ? caretakerAge : undefined,
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

            // Update interview state from server response
            if (payload.interviewState) {
                setInterviewState(payload.interviewState);
            } else if (payload.responseType === "advice") {
                setInterviewState(DEFAULT_INTERVIEW_STATE);
            }

            // Tracking and risk
            if (payload.transcript && payload.severity) {
                trackSymptom(payload.transcript, payload.severity);
            }
            if (payload.riskScore !== undefined) {
                saveRiskScore(payload.riskScore);
                setRiskScore(payload.riskScore);
            }

            // Haptics
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
        } catch {
            const userMessage = tr("apiError", lang);
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

            // Medicine reminder trigger
            const textLower = payload.text?.toLowerCase() || "";
            if (textLower.includes("dosage") || textLower.includes("hours") || textLower.includes("goli") || textLower.includes("pill") || textLower.includes("take")) {
                const wantsReminder = window.confirm(`Arogya AI: Set a reminder for this medicine?`);
                if (wantsReminder) {
                    scheduleMedicineReminder("Prescribed Medicine", 8, language);
                    showToast("Reminder set for every 8 hours");
                }
            }
        } catch {
            const friendly = tr("imageError", lang);
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
                vibrateTap();

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
                        setCardText(tr("voiceError", lang));
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
            setCardText(tr("micPermission", lang));
            setCardSeverity("caution");
            setCardOpen(true);
            setIsListening(false);
        }
    };

    const onPickMedicineImage = () => {
        vibrateTap();
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
        cardSeverity === "safe" ? tr("severity_safe", lang) : cardSeverity === "caution" ? tr("severity_caution", lang) : tr("severity_urgent", lang);

    const sharePrescription = () => {
        vibrateTap();
        if (messages.length === 0) {
            showToast(tr("noConversationError", lang));
            return;
        }
        const doctorMessages = messages.filter(m => m.role === "assistant").map(m => m.text);
        if (doctorMessages.length > 0) {
            shareOnWhatsApp(doctorMessages[doctorMessages.length - 1], language);
        }
    };

    const handleSaveAudio = () => {
        vibrateTap();
        if (latestAudioRef.current) {
            const link = document.createElement("a");
            link.href = latestAudioRef.current.startsWith("http")
                ? latestAudioRef.current
                : `data:audio/mp3;base64,${latestAudioRef.current}`;
            link.download = `arogya-advice-${new Date().toDateString()}.mp3`;
            link.click();
        }
    };

    const downloadPrescription = () => {
        vibrateTap();
        if (messages.length === 0) {
            showToast(tr("noConversationError", lang));
            return;
        }
        const patientName = session?.user?.name || "Guest Patient";
        let content = `=================================================\n`;
        content += `               ${tr("summaryHeader", lang)}               \n`;
        content += `=================================================\n\n`;
        content += `Patient Name: ${patientName}\n`;
        content += `Date: ${new Date().toLocaleDateString()}  Time: ${new Date().toLocaleTimeString()}\n`;
        content += `Language: ${LANGUAGE_LABELS[language]}\n`;
        content += `-------------------------------------------------\n\n`;
        const userMessages = messages.filter(m => m.role === "user").map(m => m.text);
        if (userMessages.length > 0) {
            userMessages.forEach((msg) => { content += `* ${msg}\n`; });
        }
        content += `\n-------------------------------------------------\n`;
        const doctorMessages = messages.filter(m => m.role === "assistant").map(m => m.text);
        if (doctorMessages.length > 0) {
            content += `\n${doctorMessages[doctorMessages.length - 1]}\n`;
        }
        content += `\n-------------------------------------------------\n`;
        content += `${tr("disclaimer", lang)}\n`;
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

    const handleMCQComplete = (contextString: string) => {
        setShowMCQ(false);
        submitVoice({ message: contextString, language });
    };

    const handleBodyRegionSelect = (region: BodyRegion) => {
        setShowBodyMap(false);
        const mapping = regionLabels[region];
        if (mapping.mcqCategory === "headache" || mapping.mcqCategory === "fever" || mapping.mcqCategory === "stomach") {
            setMcqCategory(mapping.mcqCategory as SymptomMCQCategory);
            setShowMCQ(true);
        } else {
            // General category — just send as text
            const regionText = tr(mapping.key as any, lang);
            submitVoice({ message: `${regionText} pain`, language });
        }
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

            {/* Top Navbar — ALWAYS VISIBLE */}
            <div className="absolute top-[30px] sm:top-[40px] z-50 flex w-full justify-between items-center px-4 sm:px-6">
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => { vibrateTap(); onLanguageSwitch(); }}
                        className="inline-flex min-h-[36px] items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white hover:bg-white/10 hover:border-white/20 transition-all shadow-sm"
                    >
                        <Languages className="h-3.5 w-3.5 text-white/70" />
                        <span>{LANGUAGE_LABELS[language] || language}</span>
                    </button>
                    <a
                        href="/dashboard"
                        className="inline-flex min-h-[36px] items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white hover:bg-white/10 hover:border-white/20 transition-all shadow-sm no-underline"
                    >
                        <BarChart2 className="h-3.5 w-3.5 text-white/70" />
                        <span>{tr("dashboard", lang)}</span>
                    </a>
                    {hasMemory && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            </span>
                            <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400">{tr("memoryActive", lang)}</span>
                        </div>
                    )}
                    <CaretakerToggle
                        language={lang}
                        onCaretakerChange={(active, age) => {
                            setCaretakerActive(active);
                            setCaretakerAge(age);
                        }}
                    />
                </div>

                <div className="flex flex-col items-center pointer-events-none absolute left-1/2 -translate-x-1/2">
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold tracking-tight text-white/90">{tr("appName", lang)}</h1>
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
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#25D366]/30 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors min-w-[48px] min-h-[48px]"
                        title={tr("shareWhatsApp", lang)}
                    >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766 0 1.011.266 1.996.772 2.87l-.824 3.003 3.078-.809a5.728 5.728 0 002.742.695h.001c3.181 0 5.768-2.586 5.768-5.766 0-3.181-2.587-5.767-5.769-5.767z" />
                        </svg>
                    </button>
                    {session?.user || userProfile ? (
                        <div className="flex items-center gap-2">
                            {displayUserImage ? (
                                <img src={displayUserImage} alt={session?.user?.name || userProfile?.name || "User"} className="h-8 w-8 rounded-full ring-2 ring-white/10 object-cover min-w-[32px] min-h-[32px]" />
                            ) : (
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white text-xs font-bold ring-1 ring-white/20 min-w-[32px] min-h-[32px]">
                                    {userProfile?.name?.substring(0, 2)?.toUpperCase() || "GU"}
                                </div>
                            )}
                            {session?.user && (
                                <button onClick={() => signOut()} className="text-[10px] font-bold text-white/40 hover:text-red-400 transition-colors uppercase tracking-wider bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-full min-h-[36px]">
                                    {tr("logout", lang)}
                                </button>
                            )}
                        </div>
                    ) : (
                        <button
                            onClick={() => signIn("google")}
                            className="text-xs font-bold text-white transition-colors tracking-wide bg-white/10 hover:bg-white/20 px-4 py-1.5 rounded-full flex items-center gap-2 shadow-sm border border-white/10 min-h-[36px]"
                        >
                            <span>{tr("signIn", lang)}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="absolute top-[85px] sm:top-[90px] left-1/2 -translate-x-1/2 flex flex-col items-center justify-between w-full h-[calc(100vh-160px)] overflow-hidden px-4 z-10 pb-4">

                {/* Scrollable Message List */}
                <div ref={chatRef} className="flex-1 w-full max-w-[700px] overflow-y-auto mb-4 mt-4 px-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center w-full h-full pb-20 pt-8">
                            <div className="mb-6">
                                <AnnouncementBadge text={tr("badgeText", lang)} />
                            </div>
                            <div className="text-center">
                                <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>
                                    {tr("heroTitle", lang)}{' '}
                                    <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#FF8C00] to-white italic">
                                        {tr("heroHighlight", lang)}
                                    </span><br className="sm:hidden" /> {tr("heroEnding", lang)}
                                </h1>
                                <p className="text-base font-semibold sm:text-lg text-[rgba(255,255,255,0.4)] whitespace-pre-line leading-relaxed max-w-[500px] mx-auto mt-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                                    {tr("heroSubtitle", lang)}
                                </p>
                            </div>

                            {/* Daily tip card */}
                            <div className="mt-8 w-full max-w-[500px] mx-auto">
                                <div
                                    className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                                    style={{
                                        background: "rgba(255,140,0,0.06)",
                                        border: "1px solid rgba(255,140,0,0.15)",
                                    }}
                                >
                                    <Lightbulb className="h-5 w-5 text-[#FF8C00] shrink-0" />
                                    <div>
                                        <span className="text-[11px] font-bold text-[#FF8C00]/80 uppercase tracking-wider">{tr("dailyTip", lang)}</span>
                                        <p className="text-sm text-white/70 mt-0.5">{getTodaysTip(lang)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Body Map button */}
                            <button
                                onClick={() => { vibrateTap(); setShowBodyMap(true); }}
                                className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all active:scale-95 min-h-[48px]"
                                style={{
                                    background: "rgba(255,255,255,0.04)",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    color: "rgba(255,255,255,0.6)",
                                }}
                            >
                                🧍 {tr("tapBody", lang)}
                            </button>
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

                            {/* Inline Response Card (no overlay) */}
                            {cardOpen && (
                                <ResponseCard
                                    open={cardOpen}
                                    text={cardText}
                                    severity={cardSeverity}
                                    severityLabel={severityLabel}
                                    replayLabel={tr("replay", lang)}
                                    clinic={cardClinic}
                                    audioUrl={latestAudioRef.current}
                                    onReplay={() => playAudio(latestAudioRef.current)}
                                    onClose={() => setCardOpen(false)}
                                    onSaveAudio={handleSaveAudio}
                                    onShareWhatsApp={sharePrescription}
                                />
                            )}

                            {isVoiceLoading && (
                                <div className="flex items-end gap-3 w-full justify-start mt-4">
                                    <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-b from-[#FF8C00] to-[#E85D00] flex items-center justify-center p-[1.5px] shadow-lg animate-pulse">
                                        <div className="bg-[#060A14] w-full h-full rounded-full flex items-center justify-center">
                                            <Cross className="h-4 w-4 text-[#FF8C00]" />
                                        </div>
                                    </div>
                                    <div className="rounded-[24px_24px_24px_4px] bg-[rgba(13,21,37,0.7)] backdrop-blur-md border border-white/10 px-5 py-4">
                                        <div className="flex items-center gap-2">
                                            <LoaderCircle className="h-5 w-5 text-[#FF8C00] animate-spin" />
                                            <span className="text-sm text-white/50">{tr("thinking", lang)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Body Map Overlay */}
                    <AnimatePresence>
                        {showBodyMap && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="py-4"
                            >
                                <BodyMap
                                    language={lang}
                                    onRegionSelect={handleBodyRegionSelect}
                                    onClose={() => setShowBodyMap(false)}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* MCQ overlay */}
                    <AnimatePresence>
                        {showMCQ && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="py-4"
                            >
                                <SymptomMCQ
                                    category={mcqCategory}
                                    language={lang}
                                    onComplete={handleMCQComplete}
                                    onClose={() => setShowMCQ(false)}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Interview Progress Indicator */}
                <AnimatePresence>
                    {interviewState.active && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="w-full max-w-[700px] shrink-0 mb-3"
                        >
                            <div className="flex flex-col items-center gap-2 px-5 py-3 rounded-2xl bg-[rgba(13,21,37,0.8)] backdrop-blur-md border border-[#FF8C00]/20 shadow-[0_0_24px_rgba(255,140,0,0.08)]">
                                <div className="flex items-center gap-2 text-xs font-semibold text-[#FF8C00]/90 tracking-wide">
                                    <span className="relative flex h-2 w-2">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF8C00] opacity-60" />
                                        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FF8C00]" />
                                    </span>
                                    <span>{tr("gatheringInfo", lang)}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    {Array.from({ length: getTotalQuestions(interviewState.category as SymptomCategory) }).map((_, i) => {
                                        const answered = i < (interviewState.answers?.length ?? 0);
                                        const current = i === (interviewState.answers?.length ?? 0);
                                        return (
                                            <motion.div
                                                key={i}
                                                initial={{ scale: 0.8 }}
                                                animate={{ scale: current ? 1.2 : 1 }}
                                                className={`relative h-3 w-3 rounded-full transition-all duration-300 ${
                                                    answered
                                                        ? "bg-[#FF8C00] shadow-[0_0_8px_rgba(255,140,0,0.5)]"
                                                        : current
                                                            ? "bg-[#FF8C00]/40 ring-2 ring-[#FF8C00]/60"
                                                            : "bg-white/10 border border-white/15"
                                                }`}
                                            >
                                                {answered && (
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        className="absolute inset-0 flex items-center justify-center text-[8px] text-white font-bold"
                                                    >
                                                        ✓
                                                    </motion.div>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </div>
                                <span className="text-[11px] text-white/40 font-medium">
                                    {tr("questionOf", lang)} {Math.min((interviewState.answers?.length ?? 0) + 1, getTotalQuestions(interviewState.category as SymptomCategory))} / {getTotalQuestions(interviewState.category as SymptomCategory)}
                                </span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Input Area */}
                <div className="w-full max-w-[700px] shrink-0 relative z-30">
                    <div className="absolute bottom-full left-0 right-0 mb-4 flex justify-center pointer-events-none z-50">
                        <VoiceWaveform isListening={isListening} isProcessing={isVoiceLoading} stream={activeStream} />
                    </div>
                    <ChatInput
                        isListening={false}
                        onOptionClick={(id) => {
                            vibrateTap();
                            if (id === 'medicine') onPickMedicineImage();
                            if (id === 'clinic') document.getElementById('clinic-finder-btn')?.click();
                            if (id === 'profile') setShowProfileSetup(true);
                        }}
                        placeholder={tr("placeholder", lang)}
                        getPayload={() => ({
                            lat: userLocation?.lat,
                            lng: userLocation?.lng,
                            history: getHistory(),
                            patientProfile: userProfile,
                            symptomsTracker: getClientSymptomsTracker(),
                            interviewState,
                            caretakerAge: caretakerActive ? caretakerAge : undefined,
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
                            if (payload.interviewState) {
                                setInterviewState(payload.interviewState);
                            } else if (payload.responseType === "advice") {
                                setInterviewState(DEFAULT_INTERVIEW_STATE);
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

                    {/* Bottom action buttons — below input */}
                    <div className="flex items-center justify-center gap-3 mt-4">
                        {messages.length === 0 ? (
                            <ImportButtons
                                onImport={(id) => {
                                    vibrateTap();
                                    if (id === 'medicine') onPickMedicineImage();
                                    if (id === 'clinic') document.getElementById('clinic-finder-btn')?.click();
                                }}
                            />
                        ) : (
                            <div className="flex gap-3">
                                <button
                                    onClick={downloadPrescription}
                                    className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-[#060A14] hover:bg-[#0D1525] text-xs font-medium text-white/60 hover:text-white transition-all min-h-[48px]"
                                >
                                    {tr("downloadPrescription", lang)}
                                </button>
                                <button
                                    onClick={() => onPickMedicineImage()}
                                    className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-[#060A14] hover:bg-[#0D1525] text-xs font-medium text-white/60 hover:text-white transition-all min-h-[48px]"
                                >
                                    <Pill className="h-3.5 w-3.5" />
                                    {tr("scanMedicine", lang)}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom bar: 3 buttons always visible */}
            <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center gap-3 px-4 py-3" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
                <button
                    onClick={() => { vibrateTap(); onPickMedicineImage(); }}
                    className="flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-medium transition-all active:scale-95 min-h-[48px]"
                    style={{
                        background: "rgba(255,140,0,0.08)",
                        border: "1px solid rgba(255,140,0,0.15)",
                        color: "#FF8C00",
                    }}
                >
                    💊 {tr("medicine", lang)}
                </button>
                <button
                    onClick={() => { vibrateTap(); document.getElementById('clinic-finder-btn')?.click(); }}
                    className="flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-medium transition-all active:scale-95 min-h-[48px]"
                    style={{
                        background: "rgba(0,229,160,0.06)",
                        border: "1px solid rgba(0,229,160,0.15)",
                        color: "#00E5A0",
                    }}
                >
                    📍 {tr("clinic", lang)}
                </button>
                <a
                    href="tel:108"
                    className="flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold transition-all active:scale-95 min-h-[48px] no-underline"
                    style={{
                        background: "rgba(255,68,68,0.08)",
                        border: "1px solid rgba(255,68,68,0.2)",
                        color: "#FF4444",
                    }}
                >
                    🚨 108
                </a>
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
                        <p className="mt-8 text-base font-bold tracking-wide text-white">{tr("scanning", lang)}</p>
                        <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-white/40">{tr("analyzingMedicine", lang)}</p>
                    </div>
                </div>
            )}

            {/* Hidden components */}
            <div className="opacity-0 pointer-events-none absolute w-[1px] h-[1px] overflow-hidden">
                <ClinicFinder
                    label={tr("clinic", lang)} sublabel="" permissionDeniedLabel="" onClinicFound={(clinic) => {
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
