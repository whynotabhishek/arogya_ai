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

// ── Question bank (Multi-lingual) ─────────

import type { SupportedLanguage } from "@/prompts/health";

export const interviewQuestions: Record<SymptomCategory, Record<SupportedLanguage, string[]>> = {
    headache: {
        english: [
            "Since how many days do you have this headache?",
            "Where exactly does it hurt — front, back, or sides?",
            "Do you also have a fever?",
            "Rate the pain severity from 1 to 10."
        ],
        kannada: [
            "ಎಷ್ಟು ದಿನಗಳಿಂದ ತಲೆ ನೋವು ಇದೆ?",
            "ನೋವು ತಲೆಯ ಯಾವ ಭಾಗದಲ್ಲಿ ಇದೆ — ಮುಂದೆ, ಹಿಂದೆ, ಅಥವಾ ಬದಿಯಲ್ಲಿ?",
            "ಜ್ವರ ಕೂಡ ಇದೆಯೇ?",
            "ನೋವು 1 ರಿಂದ 10 ರಲ್ಲಿ ಎಷ್ಟಿದೆ?"
        ],
        hindi: [
            "सिरदर्द कितने दिनों से है?",
            "दर्द सिर के किस हिस्से में है — आगे, पीछे, या किनारों पर?",
            "क्या आपको बुखार भी है?",
            "1 से 10 तक दर्द की तीव्रता कितनी है?"
        ],
        telugu: [
            "ఈ తలనొప్పి ఎన్ని రోజుల నుంచి ఉంది?",
            "నొప్పి తలలో ఎక్కడ ఉంది — ముందు, వెనుక, లేదా పక్కన?",
            "మీకు జ్వరం కూడా ఉందా?",
            "1 నుండి 10 వరకు నొప్పి తీవ్రత ఎంత ఉందో చెప్పండి."
        ]
    },
    fever: {
        english: [
            "Since how many days do you have a fever?",
            "What is your temperature currently?",
            "Do you have body aches?",
            "Is this for a child or an adult?"
        ],
        kannada: [
            "ಎಷ್ಟು ದಿನಗಳಿಂದ ಜ್ವರ ಇದೆ?",
            "ತಾಪಮಾನ ಎಷ್ಟಿದೆ?",
            "ಮೈ ಕೈ ನೋವು ಇದೆಯೇ?",
            "ಇದು ಮಗುವಿಗೆ ಅಥವಾ ವಯಸ್ಕರಿಗೆ?"
        ],
        hindi: [
            "बुखार कितने दिनों से है?",
            "अभी आपका तापमान कितना है?",
            "क्या आपके शरीर में दर्द है?",
            "क्या यह बच्चे या वयस्क के लिए है?"
        ],
        telugu: [
            "ఎన్ని రోజుల నుంచి జ్వరం ఉంది?",
            "ప్రస్తుతం ఉష్ణోగ్రత ఎంత ఉంది?",
            "ఒళ్ళు నొప్పులు ఉన్నాయా?",
            "ఇది వయోజనులకా లేదా పిల్లలకా?"
        ]
    },
    stomach: {
        english: [
            "Since how many days do you have stomach pain?",
            "Do you have any nausea or vomiting?",
            "Did the pain start after eating something specific?",
            "Where does it hurt — upper, lower, left, or right?"
        ],
        kannada: [
            "ಎಷ್ಟು ದಿನಗಳಿಂದ ಹೊಟ್ಟೆ ನೋವು ಇದೆ?",
            "ವಾಂತಿ ಅಥವಾ ವಾಕರಿಕೆ ಆಗುತ್ತಿದೆಯೇ?",
            "ಏನಾದರೂ ನಿರ್ದಿಷ್ಟವಾದದ್ದನ್ನು ತಿಂದ ನಂತರ ನೋವು ಶುರುವಾಯಿತೇ?",
            "ಹೊಟ್ಟೆ ನೋವು ಎಲ್ಲಿ ಇದೆ — ಮೇಲೆ, ಕೆಳಗೆ, ಎಡ, ಅಥವಾ ಬಲ?"
        ],
        hindi: [
            "पेट दर्द कितने दिनों से है?",
            "क्या उल्टी या मितली हो रही है?",
            "क्या दर्द कुछ खास खाने के बाद शुरू हुआ?",
            "पेट में दर्द कहाँ है — ऊपर, नीचे, बाएँ या दाएँ?"
        ],
        telugu: [
            "ఎన్ని రోజుల నుంచి కడుపు నొప్పి ఉంది?",
            "వాంతులు లేదా వికారం ఉందా?",
            "ఏదైనా తిన్న తర్వాత నొప్పి మొదలైందా?",
            "నొప్పి ఎక్కడ ఉంది — పైన, కింద, ఎడమ, లేదా కుడి వైపు?"
        ]
    },
    chest: {
        english: [
            "Since how many days do you have chest pain?",
            "Are you experiencing any shortness of breath?",
            "Is there pain radiating to your left arm?",
            "Do you have any history of heart issues?"
        ],
        kannada: [
            "ಎಷ್ಟು ದಿನಗಳಿಂದ ಎದೆ ನೋವು ಇದೆ?",
            "ಉಸಿರಾಟದಲ್ಲಿ ಏನಾದರೂ ತೊಂದರೆ ಇದೆಯೇ?",
            "ನೋವು ಎಡ ಕೈಗೆ ಹರಡುತ್ತಿದೆಯೇ?",
            "ಹಿಂದೆ ಏನಾದರೂ ಹೃದಯ ಸಂಬಂಧಿ ಸಮಸ್ಯೆ ಇತ್ತೇ?"
        ],
        hindi: [
            "सीने में दर्द कितने दिनों से है?",
            "क्या सांस लेने में कोई तकलीफ हो रही है?",
            "क्या दर्द आपके बाएं हाथ तक जा रहा है?",
            "क्या आपको पहले कभी दिल की कोई बीमारी रही है?"
        ],
        telugu: [
            "చాతీ నొప్పి ఎన్ని రోజుల నుంచి ఉంది?",
            "శ్వాస తీసుకోవడంలో ఏదైనా ఇబ్బంది ఉందా?",
            "నొప్పి ఎడమ చేతికి వ్యాపిస్తుందా?",
            "గతంలో గుండె సమస్యలు ఏమైనా ఉన్నాయా?"
        ]
    },
    general: {
        english: [
            "Since how many days do you have this problem?",
            "Rate your problem's severity from 1 to 10.",
            "Have you taken any medication for this?",
            "Has this issue occurred before?"
        ],
        kannada: [
            "ಎಷ್ಟು ದಿನಗಳಿಂದ ಈ ಸಮಸ್ಯೆ ಇದೆ?",
            "ನಿಮ್ಮ ಸಮಸ್ಯೆಯ ತೀವ್ರತೆಯನ್ನು 1 ರಿಂದ 10 ರಲ್ಲಿ ಎಷ್ಟಿದೆ ಎಂದು ಹೇಳಿ.",
            "ಇದಕ್ಕಾಗಿ ಯಾವುದೇ ಮಾತ್ರೆ ತೆಗೆದುಕೊಂಡಿದ್ದೀರಾ?",
            "ಮೊದಲು ಈ ಸಮಸ್ಯೆ ಬಂದಿತ್ತೇ?"
        ],
        hindi: [
            "यह समस्या कितने दिनों से है?",
            "अपनी समस्या की गंभीरता को 1 से 10 के बीच बताएं।",
            "क्या आपने इसके लिए कोई दवा ली है?",
            "क्या यह समस्या पहले भी हुई है?"
        ],
        telugu: [
            "ఈ సమస్య ఎన్ని రోజుల నుంచి ఉంది?",
            "మీ సమస్య తీవ్రతను 1 నుండి 10 వరకు అంచనా వేయండి.",
            "దీని కోసం ఏమైనా మందులు వాడారా?",
            "ఇది ఇంతకు ముందు కూడా జరిగిందా?"
        ]
    }
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
    language: SupportedLanguage = "english"
): string | null {
    const questionsObj = interviewQuestions[category] ?? interviewQuestions.general;
    const questions = questionsObj[language] ?? questionsObj.english;
    if (questionIndex < 0 || questionIndex >= questions.length) return null;
    return questions[questionIndex];
}

/**
 * Get total number of questions for a category.
 */
export function getTotalQuestions(category: SymptomCategory): number {
    const questionsObj = interviewQuestions[category] ?? interviewQuestions.general;
    return questionsObj.english.length;
}

/**
 * Build a full patient context string from the interview answers,
 * for sending to Groq AI to generate a comprehensive response.
 */
export function buildInterviewContext(
    category: SymptomCategory,
    answers: string[],
): string {
    const questionsObj = interviewQuestions[category] ?? interviewQuestions.general;
    const questions = questionsObj.english; // Build context in english to send to Groq

    const lines = questions.map((q, i) => {
        const answer = answers[i] ?? "Not answered";
        return `Q: ${q}\nA: ${answer}`;
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
