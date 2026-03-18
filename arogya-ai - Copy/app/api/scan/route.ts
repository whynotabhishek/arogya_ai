import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { murfTextToSpeech } from "@/lib/murf";
import type { SupportedLanguage } from "@/prompts/health";

type ScanPayload = {
    imageBase64?: string;
    mimeType?: string;
    language?: SupportedLanguage;
};

const GROQ_API_KEY = process.env.GROQ_API_KEY;

function languageLabel(language: SupportedLanguage): string {
    if (language === "kannada") return "Kannada";
    if (language === "hindi") return "Hindi";
    if (language === "telugu") return "Telugu";
    return "English";
}

function severityFromText(text: string): "safe" | "caution" | "urgent" {
    const normalized = text.toLowerCase();
    if (
        normalized.includes("urgent") ||
        normalized.includes("emergency") ||
        normalized.includes("immediately")
    ) {
        return "urgent";
    }
    if (
        normalized.includes("warning") ||
        normalized.includes("caution") ||
        normalized.includes("doctor")
    ) {
        return "caution";
    }
    return "safe";
}

export async function POST(req: Request) {
    try {
        if (!GROQ_API_KEY) {
            throw new Error("Groq API key is missing");
        }

        const payload = (await req.json()) as ScanPayload;
        const language = payload.language ?? "english";

        if (!payload.imageBase64) {
            return NextResponse.json(
                { error: "Please select a medicine image to scan." },
                { status: 400 },
            );
        }

        const groq = new Groq({ apiKey: GROQ_API_KEY });
        const prompt =
            "You are a medical assistant. Identify this medicine. Return: name, purpose, dosage, warnings. " +
            `Respond in ${languageLabel(language)}. Max 3 sentences. Simple words only. No medical jargon.`;

        const completion = await groq.chat.completions.create({
            model: "llava-1.5-7b-4096-preview",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:${payload.mimeType ?? "image/jpeg"};base64,${payload.imageBase64}`,
                            },
                        },
                    ],
                },
            ],
            temperature: 0.2,
            max_tokens: 250,
        });

        const text = completion.choices[0]?.message?.content?.trim() ?? "";
        if (!text) {
            throw new Error("Groq returned an empty response");
        }

        let audio = "";
        try {
            audio = await murfTextToSpeech({
                text,
                language,
                preferredModelVersion: "gen2",
            });
        } catch (ttsError) {
            console.error("Scan TTS non-fatal failure", ttsError);
        }

        return NextResponse.json({
            text,
            audio,
            severity: severityFromText(text),
        });
    } catch (error) {
        console.error("/api/scan failed", error);
        return NextResponse.json(
            { error: "I could not scan this image right now. Please try another clear photo." },
            { status: 500 },
        );
    }
}
