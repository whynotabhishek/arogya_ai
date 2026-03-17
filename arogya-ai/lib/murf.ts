import type { SupportedLanguage } from "@/prompts/health";

export type MurfTtsRequest = {
    text: string;
    language: SupportedLanguage;
    preferredModelVersion?: string;
};

export type MurfSttRequest = {
    audioBase64: string;
    language: SupportedLanguage;
    mimeType?: string;
};

const MURF_API_KEY = process.env.MURF_API_KEY;
const MURF_TTS_URL = process.env.MURF_TTS_URL ?? "https://api.murf.ai/v1/speech/generate";
const MURF_STT_URL = process.env.MURF_STT_URL ?? "https://api.murf.ai/v1/speech/transcribe";

const VOICE_BY_LANGUAGE: Record<SupportedLanguage, string> = {
    // Murf may not expose Kannada and Telugu voices for every account, so use a Hindi fallback if absent, or use en/hi.
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

export async function murfTextToSpeech({ text, language, preferredModelVersion }: MurfTtsRequest): Promise<string> {
    assertMurfKey();

    const modelVersions = preferredModelVersion
        ? [preferredModelVersion, "GEN2"]
        : ["GEN2"];

    let lastError = "";
    for (const modelVersion of modelVersions) {
        const response = await fetch(MURF_TTS_URL, {
            method: "POST",
            headers: murfHeaders(),
            body: JSON.stringify({
                text,
                voiceId: VOICE_BY_LANGUAGE[language],
                modelVersion,
                format: "mp3",
                sampleRate: 24000,
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
        if (audio) {
            return audio;
        }
    }

    throw new Error(`Murf TTS failed: ${lastError || "No audio returned"}`);
}

export async function murfSpeechToText({
    audioBase64,
    language,
    mimeType = "audio/webm",
}: MurfSttRequest): Promise<string> {
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
        throw new Error("Missing GROQ_API_KEY for STT fallback.");
    }

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
            "Authorization": `Bearer ${groqKey}`,
        },
        body: formData as any,
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Groq STT failed: ${err}`);
    }

    const data = await res.json() as { text: string };
    return data.text || "";
}
