import Groq from "groq-sdk";
import {
    ENGLISH_PROMPT,
    HINDI_PROMPT,
    KANNADA_PROMPT,
    TELUGU_PROMPT,
    type SupportedLanguage,
} from "@/prompts/health";
import { withTimeout, withRetry } from "@/lib/cache";

export type HealthIntent = "symptom" | "medicine_query" | "emergency" | "location" | "general";
export type Severity = "safe" | "caution" | "urgent";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "dummy_key_for_build" });

// Fast model for classification (10x faster), quality model for health advice
const FAST_MODEL = "llama-3.1-8b-instant";
const QUALITY_MODEL = "llama-3.3-70b-versatile";

async function complete(
    systemPrompt: string,
    userPrompt: string,
    maxTokens: number,
    model = QUALITY_MODEL,
    temperature = 0.3,
): Promise<string> {
    const completion = await groq.chat.completions.create({
        model,
        temperature,
        max_tokens: maxTokens,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
        ],
    });

    return completion.choices[0]?.message?.content?.trim() ?? "";
}

function extractJson<T>(raw: string, fallback: T): T {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return fallback;

    try {
        return JSON.parse(match[0]) as T;
    } catch {
        return fallback;
    }
}

function languagePrompt(language: SupportedLanguage): string {
    if (language === "kannada") return KANNADA_PROMPT;
    if (language === "hindi") return HINDI_PROMPT;
    if (language === "telugu") return TELUGU_PROMPT;
    return ENGLISH_PROMPT;
}

/**
 * Classify intent using the FAST model (8B) with timeout + retry
 */
export async function classifyIntent(message: string): Promise<HealthIntent> {
    const fn = () =>
        withTimeout(
            complete(
                "Classify patient input into one of: symptom, medicine_query, emergency, location, general. Return only strict JSON like {\"intent\":\"symptom\"}.",
                message,
                120,
                FAST_MODEL,
                0.1,
            ),
            8000,
        );

    try {
        const completion = await withRetry(fn, 1);
        const json = extractJson<{ intent?: HealthIntent }>(completion, { intent: "general" });
        return json.intent ?? "general";
    } catch {
        return "general";
    }
}

/**
 * Classify severity using the FAST model with timeout
 */
export async function classifySeverity(input: {
    message: string;
    context: string;
    intent: HealthIntent;
}): Promise<Severity> {
    try {
        const completion = await withTimeout(
            complete(
                "You are a triage assistant. Return one severity only in strict JSON as {\"severity\":\"safe|caution|urgent\"}. Prioritize patient safety.",
                `Intent: ${input.intent}\nMessage: ${input.message}\nContext: ${input.context}`,
                120,
                FAST_MODEL,
                0.1,
            ),
            8000,
        );

        const json = extractJson<{ severity?: Severity }>(completion, { severity: "caution" });
        return json.severity ?? "caution";
    } catch {
        return "caution";
    }
}

/**
 * Generate the full health response using the QUALITY model with retry.
 * max_tokens: 120, temperature: 0.3 — enforces concise 3-sentence responses.
 */
export async function generateHealthResponse(input: {
    message: string;
    language: SupportedLanguage;
    context: string;
    severity: Severity;
    intent: HealthIntent;
    caretakerAge?: number;
}): Promise<string> {
    let userPrompt =
        `User message: ${input.message}\n` +
        `Intent: ${input.intent}\n` +
        `Severity: ${input.severity}\n` +
        `RAG context: ${input.context}\n` +
        "Give exactly 3 sentences. No headers, no lists, no bullet points.";

    if (input.caretakerAge) {
        userPrompt += `\nThis is a caretaker asking for a ${input.caretakerAge} year old patient. Address advice for the patient, not the caretaker.`;
    }

    const fn = () =>
        withTimeout(
            complete(
                languagePrompt(input.language),
                userPrompt,
                120,
                QUALITY_MODEL,
                0.3,
            ),
            10000,
        );

    return withRetry(fn, 1);
}
