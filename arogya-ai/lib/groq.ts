import Groq from "groq-sdk";
import {
    ENGLISH_PROMPT,
    HINDI_PROMPT,
    KANNADA_PROMPT,
    TELUGU_PROMPT,
    type SupportedLanguage,
} from "@/prompts/health";

export type HealthIntent = "symptom" | "medicine_query" | "emergency" | "location" | "general";
export type Severity = "safe" | "caution" | "urgent";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "dummy_key_for_build" });
const MODEL = "llama-3.3-70b-versatile";

async function complete(systemPrompt: string, userPrompt: string, maxTokens: number): Promise<string> {
    const completion = await groq.chat.completions.create({
        model: MODEL,
        temperature: 0.2,
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

export async function classifyIntent(message: string): Promise<HealthIntent> {
    const completion = await complete(
        "Classify patient input into one of: symptom, medicine_query, emergency, location, general. Return only strict JSON like {\"intent\":\"symptom\"}.",
        message,
        120,
    );

    const json = extractJson<{ intent?: HealthIntent }>(completion, { intent: "general" });
    return json.intent ?? "general";
}

export async function classifySeverity(input: {
    message: string;
    context: string;
    intent: HealthIntent;
}): Promise<Severity> {
    const completion = await complete(
        "You are a triage assistant. Return one severity only in strict JSON as {\"severity\":\"safe|caution|urgent\"}. Prioritize patient safety.",
        `Intent: ${input.intent}\nMessage: ${input.message}\nContext: ${input.context}`,
        120,
    );

    const json = extractJson<{ severity?: Severity }>(completion, { severity: "caution" });
    return json.severity ?? "caution";
}

export async function generateHealthResponse(input: {
    message: string;
    language: SupportedLanguage;
    context: string;
    severity: Severity;
    intent: HealthIntent;
}): Promise<string> {
    return complete(
        languagePrompt(input.language),
        `User message: ${input.message}\n` +
        `Intent: ${input.intent}\n` +
        `Severity: ${input.severity}\n` +
        `RAG context: ${input.context}\n` +
        "Respond using this exact structure and headings: 🩺 AI Health Assessment, Patient Symptoms, Possible Conditions, Risk Level, Recommended Actions, When to Seek Medical Attention, Suggested Medical Tests, Lifestyle & Recovery Advice, and Disclaimer. " +
        "Use cautious wording and never give definitive diagnosis. Always include the disclaimer text: This AI health assessment is for informational purposes only and should not replace professional medical advice. Always consult a qualified healthcare provider for diagnosis or treatment.",
        700,
    );
}
