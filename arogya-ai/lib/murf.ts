import type { SupportedLanguage } from "@/prompts/health";
import { withTimeout, withRetry } from "@/lib/cache";

export type MurfTtsRequest = {
    text: string;
    language: SupportedLanguage;
    preferredModelVersion?: string;
    urgent?: boolean;
};

export type MurfSttRequest = {
    audioBase64: string;
    language: SupportedLanguage;
    mimeType?: string;
};

const MURF_API_KEY = process.env.MURF_API_KEY;
const MURF_TTS_URL = process.env.MURF_TTS_URL ?? "https://api.murf.ai/v1/speech/generate";

// Language-specific voices for consistent "Dr. Arogya" persona
const VOICE_BY_LANGUAGE: Record<SupportedLanguage, string> = {
    kannada: "hi-IN-shweta",
    hindi: "hi-IN-shweta",
    telugu: "hi-IN-shweta",
    english: "en-IN-isha",
};

function assertMurfKey() {
    if (!MURF_API_KEY) {
        throw new Error("Murf API key is missing");
    }
}

function murfHeaders(): Record<string, string> {
    return {
        "Content-Type": "application/json",
        "api-key": MURF_API_KEY!,
        token: MURF_API_KEY!,
        Authorization: `Bearer ${MURF_API_KEY!}`,
    };
}

/**
 * Text-to-Speech via Murf with Falcon model preference, timeout + retry.
 * For urgent messages: slightly faster speed for emphasis.
 */
export async function murfTextToSpeech({
    text,
    language,
    preferredModelVersion,
    urgent = false,
}: MurfTtsRequest): Promise<string> {
    assertMurfKey();

    // Truncate very long text to avoid excessive TTS cost/time
    const truncated = text.length > 800 ? text.slice(0, 800) + "..." : text;

    const modelVersions = preferredModelVersion
        ? [preferredModelVersion, "GEN2"]
        : ["GEN2"];

    const fn = async (): Promise<string> => {
        let lastError = "";
        for (const modelVersion of modelVersions) {
            const response = await fetch(MURF_TTS_URL, {
                method: "POST",
                headers: murfHeaders(),
                body: JSON.stringify({
                    text: truncated,
                    voiceId: VOICE_BY_LANGUAGE[language],
                    modelVersion,
                    format: "mp3",
                    sampleRate: 24000,
                    speed: urgent ? 1.05 : 0.95,     // Slightly slower for elderly, faster for urgent
                    pitch: 0,                         // Natural pitch
                }),
            });

            if (!response.ok) {
                lastError = await response.text();
                continue;
            }

            const payload = (await response.json()) as {
                audioFile?: string;
                audioUrl?: string;
                url?: string;
                audio?: string;
            };

            const audio = payload.audioFile ?? payload.audioUrl ?? payload.url ?? payload.audio ?? "";
            if (audio) return audio;
        }

        throw new Error(`Murf TTS failed: ${lastError || "No audio returned"}`);
    };

    return withRetry(() => withTimeout(fn(), 10000), 1);
}

/**
 * Speech-to-Text via Groq Whisper with timeout.
 */
export async function murfSpeechToText({
    audioBase64,
    language,
    mimeType = "audio/webm",
}: MurfSttRequest): Promise<string> {
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
        throw new Error("Missing GROQ_API_KEY for STT fallback.");
    }

    const fn = async (): Promise<string> => {
        const binaryString = atob(audioBase64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: mimeType });

        const formData = new FormData();
        formData.append("file", blob, "audio.webm");
        formData.append("model", "whisper-large-v3-turbo");

        const isoLang = language === "kannada" ? "kn" : language === "hindi" ? "hi" : language === "telugu" ? "te" : "en";
        formData.append("language", isoLang);

        const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${groqKey}`,
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            body: formData as any,
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Groq STT failed: ${err}`);
        }

        const data = (await res.json()) as { text: string };
        return data.text || "";
    };

    return withTimeout(fn(), 10000);
}
