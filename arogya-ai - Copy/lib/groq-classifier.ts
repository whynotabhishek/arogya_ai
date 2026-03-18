import Groq from "groq-sdk";

export type SeverityLevel = "green" | "amber" | "red";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function classifySeverity(symptom: string, language: string): Promise<SeverityLevel> {
    try {
        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: `You are an emergency medical triage classifier. Analyze the provided symptom and language.
Output ONLY valid JSON in this exact format: { "severity": "green" | "amber" | "red" }.
- green = general info, safe advice
- amber = monitor closely, may need doctor
- red = life-threatening, emergency response NOW
Do NOT include any markdown formatting, backticks, or other text. Just the JSON object.`,
                },
                {
                    role: "user",
                    content: `Symptom: ${symptom}\nLanguage: ${language}`,
                },
            ],
            temperature: 0,
            max_tokens: 15,
            response_format: { type: "json_object" },
        });

        const output = completion.choices[0]?.message?.content?.trim() || "";
        const parsed = JSON.parse(output) as { severity: string };

        if (parsed.severity === "green" || parsed.severity === "amber" || parsed.severity === "red") {
            return parsed.severity as SeverityLevel;
        }

        return "amber";
    } catch (error) {
        console.error("Failed to classify severity:", error);
        return "amber";
    }
}
