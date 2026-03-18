"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Language } from "@/lib/translations";
import { t } from "@/lib/translations";
import { vibrateSuccess } from "@/lib/haptics";

type MCQOption = {
    kannada: string;
    hindi: string;
    english: string;
    telugu: string;
};

type MCQQuestion = {
    q_kannada: string;
    q_hindi: string;
    q_english: string;
    q_telugu: string;
    options: MCQOption[];
};

type SymptomMCQCategory = "headache" | "fever" | "stomach";

const mcqQuestions: Record<SymptomMCQCategory, MCQQuestion[]> = {
    headache: [
        {
            q_kannada: "ನೋವು ಎಲ್ಲಿ ಇದೆ?",
            q_hindi: "दर्द कहाँ है?",
            q_english: "Where is the pain?",
            q_telugu: "నొప్పి ఎక్కడ ఉంది?",
            options: [
                { kannada: "ಮುಂದೆ", hindi: "आगे", english: "Front", telugu: "ముందు" },
                { kannada: "ಹಿಂದೆ", hindi: "पीछे", english: "Back", telugu: "వెనుక" },
                { kannada: "ಪಕ್ಕ", hindi: "साइड", english: "Side", telugu: "పక్కన" },
                { kannada: "ಎಲ್ಲಾ", hindi: "पूरा", english: "All", telugu: "అంతా" },
            ],
        },
        {
            q_kannada: "ಎಷ್ಟು ದಿನಗಳಿಂದ?",
            q_hindi: "कितने दिनों से?",
            q_english: "Since how many days?",
            q_telugu: "ఎన్ని రోజుల నుండి?",
            options: [
                { kannada: "ಇಂದು", hindi: "आज", english: "Today", telugu: "ఈరోజు" },
                { kannada: "2-3 ದಿನ", hindi: "2-3 दिन", english: "2-3 days", telugu: "2-3 రోజులు" },
                { kannada: "1 ವಾರ", hindi: "1 हफ्ता", english: "1 week", telugu: "1 వారం" },
                { kannada: "ಹೆಚ್ಚು", hindi: "ज्यादा", english: "More", telugu: "ఎక్కువ" },
            ],
        },
        {
            q_kannada: "ನೋವು ಎಷ್ಟು ತೀವ್ರ?",
            q_hindi: "दर्द कितना तेज़ है?",
            q_english: "How severe is the pain?",
            q_telugu: "నొప్పి ఎంత తీవ్రంగా ఉంది?",
            options: [
                { kannada: "ಸ್ವಲ್ಪ", hindi: "थोड़ा", english: "Mild", telugu: "కొంచెం" },
                { kannada: "ಮಧ್ಯಮ", hindi: "मध्यम", english: "Moderate", telugu: "మధ్యస్థ" },
                { kannada: "ತುಂಬಾ", hindi: "बहुत", english: "Severe", telugu: "చాలా" },
                { kannada: "ತಡೆಯಲಾಗದ", hindi: "असहनीय", english: "Unbearable", telugu: "భరించలేని" },
            ],
        },
    ],
    fever: [
        {
            q_kannada: "ಎಷ್ಟು ದಿನಗಳಿಂದ ಜ್ವರ?",
            q_hindi: "कितने दिनों से बुखार?",
            q_english: "Fever since how many days?",
            q_telugu: "ఎన్ని రోజుల నుండి జ్వరం?",
            options: [
                { kannada: "ಇಂದು", hindi: "आज", english: "Today", telugu: "ఈరోజు" },
                { kannada: "2-3 ದಿನ", hindi: "2-3 दिन", english: "2-3 days", telugu: "2-3 రోజులు" },
                { kannada: "1 ವಾರ", hindi: "1 हफ्ता", english: "1 week", telugu: "1 వారం" },
                { kannada: "ಹೆಚ್ಚು", hindi: "ज्यादा", english: "More", telugu: "ఎక్కువ" },
            ],
        },
        {
            q_kannada: "ತಾಪಮಾನ ಎಷ್ಟು?",
            q_hindi: "तापमान कितना है?",
            q_english: "What is the temperature?",
            q_telugu: "ఉష్ణోగ్రత ఎంత?",
            options: [
                { kannada: "100°F ಕೆಳಗೆ", hindi: "100°F से कम", english: "Below 100°F", telugu: "100°F కంటే తక్కువ" },
                { kannada: "100-102°F", hindi: "100-102°F", english: "100-102°F", telugu: "100-102°F" },
                { kannada: "102-104°F", hindi: "102-104°F", english: "102-104°F", telugu: "102-104°F" },
                { kannada: "104°F ಮೇಲೆ", hindi: "104°F से ज्यादा", english: "Above 104°F", telugu: "104°F కంటే ఎక్కువ" },
            ],
        },
        {
            q_kannada: "ಮೈ ಕೈ ನೋವು ಇದೆಯೇ?",
            q_hindi: "बदन दर्द है?",
            q_english: "Any body pain?",
            q_telugu: "ఒళ్ళు నొప్పులు ఉన్నాయా?",
            options: [
                { kannada: "ಹೌದು", hindi: "हाँ", english: "Yes", telugu: "అవును" },
                { kannada: "ಇಲ್ಲ", hindi: "नहीं", english: "No", telugu: "లేదు" },
            ],
        },
    ],
    stomach: [
        {
            q_kannada: "ಯಾವ ರೀತಿ ನೋವು?",
            q_hindi: "दर्द कैसा है?",
            q_english: "What type of pain?",
            q_telugu: "ఎలాంటి నొప్పి?",
            options: [
                { kannada: "ಸೆಳೆತ", hindi: "मरोड़", english: "Cramps", telugu: "నొప్పులు" },
                { kannada: "ಉರಿ", hindi: "जलन", english: "Burning", telugu: "మంట" },
                { kannada: "ಊತ", hindi: "सूजन", english: "Bloating", telugu: "ఉబ్బరం" },
                { kannada: "ತೀಕ್ಷ್ಣ", hindi: "तेज़", english: "Sharp", telugu: "తీక్షణ" },
            ],
        },
        {
            q_kannada: "ವಾಂತಿ ಆಗುತ್ತಿದೆಯೇ?",
            q_hindi: "उल्टी हो रही है?",
            q_english: "Any vomiting?",
            q_telugu: "వాంతులు అవుతున్నాయా?",
            options: [
                { kannada: "ಹೌದು", hindi: "हाँ", english: "Yes", telugu: "అవును" },
                { kannada: "ಇಲ್ಲ", hindi: "नहीं", english: "No", telugu: "లేదు" },
                { kannada: "ವಾಕರಿಕೆ ಮಾತ್ರ", hindi: "सिर्फ मतली", english: "Nausea only", telugu: "బాధ మాత్రమే" },
            ],
        },
        {
            q_kannada: "ಎಷ್ಟು ದಿನಗಳಿಂದ?",
            q_hindi: "कितने दिनों से?",
            q_english: "Since how many days?",
            q_telugu: "ఎన్ని రోజుల నుండి?",
            options: [
                { kannada: "ಇಂದು", hindi: "आज", english: "Today", telugu: "ఈరోజు" },
                { kannada: "2-3 ದಿನ", hindi: "2-3 दिन", english: "2-3 days", telugu: "2-3 రోజులు" },
                { kannada: "1 ವಾರ", hindi: "1 हफ्ता", english: "1 week", telugu: "1 వారం" },
                { kannada: "ಹೆಚ್ಚು", hindi: "ज्यादा", english: "More", telugu: "ఎక్కువ" },
            ],
        },
    ],
};

function getQuestionText(q: MCQQuestion, lang: Language): string {
    const key = `q_${lang}` as keyof MCQQuestion;
    return (q[key] as string) || q.q_english;
}

function getOptionText(opt: MCQOption, lang: Language): string {
    return opt[lang] || opt.english;
}

type SymptomMCQProps = {
    category: SymptomMCQCategory;
    language: Language;
    onComplete: (contextString: string) => void;
    onClose: () => void;
};

export function SymptomMCQ({ category, language, onComplete, onClose }: SymptomMCQProps) {
    const questions = mcqQuestions[category] || mcqQuestions.headache;
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<string[]>([]);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);

    const currentQ = questions[currentIndex];
    const isLast = currentIndex === questions.length - 1;

    const handleOptionSelect = (optIndex: number) => {
        setSelectedOption(optIndex);
        vibrateSuccess();
    };

    const handleNext = () => {
        if (selectedOption === null) return;
        const answer = getOptionText(currentQ.options[selectedOption], language);
        const newAnswers = [...answers, answer];
        setAnswers(newAnswers);
        setSelectedOption(null);

        if (isLast) {
            // Build context string
            const parts = questions.map((q, i) => {
                return `${getQuestionText(q, "english")}: ${newAnswers[i] || "N/A"}`;
            });
            const contextString = `Patient has ${category}. ${parts.join(". ")}.`;
            onComplete(contextString);
        } else {
            setCurrentIndex((prev) => prev + 1);
        }
    };

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-[700px] mx-auto"
            >
                <div
                    className="rounded-[20px] border overflow-hidden"
                    style={{
                        background: "rgba(13,21,37,0.95)",
                        borderColor: "rgba(255,255,255,0.08)",
                    }}
                >
                    <div className="p-5">
                        {/* Progress dots */}
                        <div className="flex items-center justify-center gap-2 mb-5">
                            {questions.map((_, i) => (
                                <div
                                    key={i}
                                    className="h-2.5 w-2.5 rounded-full transition-all duration-300"
                                    style={{
                                        background:
                                            i < currentIndex
                                                ? "#FF8C00"
                                                : i === currentIndex
                                                ? "rgba(255,140,0,0.4)"
                                                : "rgba(255,255,255,0.1)",
                                        boxShadow:
                                            i < currentIndex
                                                ? "0 0 8px rgba(255,140,0,0.5)"
                                                : "none",
                                    }}
                                />
                            ))}
                        </div>

                        {/* Question */}
                        <p
                            className="text-lg font-semibold text-white text-center mb-5"
                            style={{ fontFamily: "'Syne', sans-serif" }}
                        >
                            {getQuestionText(currentQ, language)}
                        </p>

                        {/* Options — 2x2 grid */}
                        <div className={`grid gap-3 mb-5 ${currentQ.options.length <= 3 ? "grid-cols-1" : "grid-cols-2"}`}>
                            {currentQ.options.map((opt, i) => {
                                const isSelected = selectedOption === i;
                                return (
                                    <motion.button
                                        key={i}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => handleOptionSelect(i)}
                                        className="px-4 py-3 rounded-xl text-[15px] font-medium text-left transition-all duration-200 min-h-[48px]"
                                        style={{
                                            background: isSelected
                                                ? "rgba(255,140,0,0.1)"
                                                : "rgba(255,255,255,0.04)",
                                            border: isSelected
                                                ? "1px solid #FF8C00"
                                                : "1px solid rgba(255,255,255,0.08)",
                                            color: isSelected ? "#FF8C00" : "rgba(255,255,255,0.8)",
                                        }}
                                    >
                                        {getOptionText(opt, language)}
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* Next button */}
                        <div className="flex items-center justify-between">
                            <button
                                onClick={onClose}
                                className="text-xs font-medium text-white/40 hover:text-white/70 transition-colors"
                            >
                                ✕
                            </button>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={handleNext}
                                disabled={selectedOption === null}
                                className="px-6 py-2.5 rounded-full text-sm font-bold text-white transition-all disabled:opacity-30"
                                style={{
                                    background:
                                        selectedOption !== null
                                            ? "linear-gradient(135deg, #FF8C00, #E85D00)"
                                            : "rgba(255,255,255,0.05)",
                                }}
                            >
                                {t("next", language)}
                            </motion.button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

export type { SymptomMCQCategory };
