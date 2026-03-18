// ──────────────────────────────────────────────────────────
// Symptom Interview System
// Asks follow-up questions like a real doctor before advice
// ──────────────────────────────────────────────────────────

export type SymptomCategory = "headache" | "fever" | "stomach" | "chest" | "general";

export type InterviewState = {
    active: boolean;
    category: SymptomCategory;
    questionIndex: number;
    answers: string[];
};

export const DEFAULT_INTERVIEW_STATE: InterviewState = {
    active: false,
    category: "general",
    questionIndex: 0,
    answers: [],
};

// ── Question bank (Kannada + English bilingual) ─────────

export const interviewQuestions: Record<SymptomCategory, string[]> = {
    headache: [
        "ಎಷ್ಟು ದಿನಗಳಿಂದ ತಲೆ ನೋವು ಇದೆ? / Since how many days do you have this headache?",
        "ನೋವು ತಲೆಯ ಯಾವ ಭಾಗದಲ್ಲಿ? / Where exactly — front, back, or sides?",
        "ಜ್ವರ ಕೂಡ ಇದೆಯೇ? / Do you have fever along with it?",
        "ನೋವು 1-10 ರಲ್ಲಿ ಎಷ್ಟು? / Rate the severity from 1 to 10?",
    ],
    fever: [
        "ಎಷ್ಟು ದಿನಗಳಿಂದ ಜ್ವರ? / Since how many days do you have fever?",
        "ತಾಪಮಾನ ಎಷ್ಟು? / What is your temperature reading?",
        "ಮೈ ಕೈ ನೋವು ಇದೆಯೇ? / Do you have body pain or body aches?",
        "ಮಕ್ಕಳಿಗೆ ಅಥವಾ ವಯಸ್ಕರಿಗೆ? / Is this for a child or an adult?",
    ],
    stomach: [
        "ಎಷ್ಟು ದಿನಗಳಿಂದ ಹೊಟ್ಟೆ ನೋವು? / Since how many days do you have stomach pain?",
        "ವಾಂತಿ ಆಗುತ್ತಿದೆಯೇ? / Do you have any vomiting?",
        "ಏನು ತಿಂದ ನಂತರ ನೋವು? / Does the pain start after eating something?",
        "ಹೊಟ್ಟೆ ನೋವು ಎಲ್ಲಿ? / Where exactly in the stomach — upper, lower, left, or right?",
    ],
    chest: [
        "ಎಷ್ಟು ದಿನಗಳಿಂದ ಎದೆ ನೋವು? / Since how many days do you have chest pain?",
        "ಉಸಿರಾಟದಲ್ಲಿ ತೊಂದರೆ ಇದೆಯೇ? / Do you have difficulty breathing?",
        "ಎಡ ಕೈ ನೋವು ಇದೆಯೇ? / Do you have any left arm pain?",
        "ಮೊದಲು ಹೃದಯ ಸಮಸ್ಯೆ ಇತ್ತೇ? / Do you have any history of heart problems?",
    ],
    general: [
        "ಎಷ್ಟು ದಿನಗಳಿಂದ ಈ ಸಮಸ್ಯೆ? / Since how many days do you have this problem?",
        "ನೋವು 1-10 ರಲ್ಲಿ ಎಷ್ಟು? / Rate the severity from 1 to 10?",
        "ಯಾವ ಮಾತ್ರೆ ತೆಗೆದುಕೊಂಡಿದ್ದೀರಾ? / Have you taken any medicine for this?",
        "ಮೊದಲು ಈ ಸಮಸ್ಯೆ ಬಂದಿತ್ತೇ? / Has this problem occurred before?",
    ],
};

// ── Keyword banks for symptom detection ─────────────────

const SYMPTOM_KEYWORDS: Record<SymptomCategory, string[]> = {
    headache: [
        "headache", "head pain", "head ache", "migraine",
        "ತಲೆ ನೋವು", "ತಲೆನೋವು", "ತಲೆ", "head",
        "सिरदर्द", "सिर दर्द", "सिर में दर्द",
        "తలనొప్పి",
    ],
    fever: [
        "fever", "temperature", "temp", "feverish", "hot body",
        "ಜ್ವರ", "ಶೀತ",
        "बुखार", "बुख़ार", "तापमान", "ज्वर",
        "జ్వరం",
    ],
    stomach: [
        "stomach", "stomach pain", "abdomen", "abdominal", "gastric",
        "acidity", "gas", "bloating", "diarrhea", "loose motion",
        "vomiting", "nausea",
        "ಹೊಟ್ಟೆ", "ಹೊಟ್ಟೆ ನೋವು", "ಗ್ಯಾಸ್",
        "पेट", "पेट दर्द", "एसिडिटी", "गैस",
        "కడుపు",
    ],
    chest: [
        "chest", "chest pain", "heart", "breathing",
        "heartburn", "palpitation",
        "ಎದೆ", "ಎದೆ ನೋವು", "ಹೃದಯ",
        "छाती", "छाती में दर्द", "दिल",
        "ఛాతీ",
    ],
    general: [], // fallback, no keywords needed
};

// Emergency keywords — these SKIP the interview entirely
const EMERGENCY_SKIP_KEYWORDS = [
    "can't breathe", "not breathing", "unconscious", "collapse",
    "seizure", "fits", "104", "105",
    "ಉಸಿರಾಟ ಇಲ್ಲ", "ಪ್ರಜ್ಞೆ ತಪ್ಪಿದ",
    "सांस नहीं", "बेहोश",
];

/**
 * Detect which symptom category a message belongs to.
 * Returns "general" as fallback.
 */
export function detectSymptomCategory(userMessage: string): SymptomCategory {
    const text = userMessage.toLowerCase();

    // Priority order: chest > fever > stomach > headache > general
    const order: SymptomCategory[] = ["chest", "fever", "stomach", "headache"];

    for (const category of order) {
        const keywords = SYMPTOM_KEYWORDS[category];
        if (keywords.some((kw) => text.includes(kw.toLowerCase()))) {
            return category;
        }
    }

    return "general";
}

/**
 * Check if a message contains any symptom keyword at all.
 */
export function containsSymptom(userMessage: string): boolean {
    const text = userMessage.toLowerCase();
    for (const category of Object.keys(SYMPTOM_KEYWORDS) as SymptomCategory[]) {
        if (category === "general") continue;
        if (SYMPTOM_KEYWORDS[category].some((kw) => text.includes(kw.toLowerCase()))) {
            return true;
        }
    }
    return false;
}

/**
 * Check if the message is an emergency that should skip the interview.
 */
export function shouldSkipInterview(userMessage: string): boolean {
    const text = userMessage.toLowerCase();
    return EMERGENCY_SKIP_KEYWORDS.some((kw) => text.includes(kw.toLowerCase()));
}

/**
 * Get the next question for the interview.
 * Returns null if all questions have been asked.
 */
export function getNextQuestion(
    category: SymptomCategory,
    questionIndex: number,
): string | null {
    const questions = interviewQuestions[category] ?? interviewQuestions.general;
    if (questionIndex < 0 || questionIndex >= questions.length) return null;
    return questions[questionIndex];
}

/**
 * Get total number of questions for a category.
 */
export function getTotalQuestions(category: SymptomCategory): number {
    return (interviewQuestions[category] ?? interviewQuestions.general).length;
}

/**
 * Build a full patient context string from the interview answers,
 * for sending to Groq AI to generate a comprehensive response.
 */
export function buildInterviewContext(
    category: SymptomCategory,
    answers: string[],
): string {
    const questions = interviewQuestions[category] ?? interviewQuestions.general;

    const lines = questions.map((q, i) => {
        // Extract English part of the question for context
        const englishPart = q.split(" / ")[1] ?? q;
        const answer = answers[i] ?? "Not answered";
        return `Q: ${englishPart}\nA: ${answer}`;
    });

    const symptomLabel =
        category === "headache" ? "headache" :
            category === "fever" ? "fever" :
                category === "stomach" ? "stomach pain" :
                    category === "chest" ? "chest pain" :
                        "health issue";

    return `--- PATIENT INTERVIEW RESULTS ---
Symptom category: ${symptomLabel}

${lines.join("\n\n")}

--- END OF INTERVIEW ---
Use ALL the above information to give very specific, personalised advice.
Do NOT give generic advice. Reference the patient's specific answers in your response.`;
}
