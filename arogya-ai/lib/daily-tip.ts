import type { Language } from "@/lib/translations";

const healthTips: Record<Language, string[]> = {
    kannada: [
        "ದಿನಕ್ಕೆ 8 ಗ್ಲಾಸ್ ನೀರು ಕುಡಿಯಿರಿ",
        "ಪ್ರತಿದಿನ 30 ನಿಮಿಷ ನಡೆಯಿರಿ",
        "ಸಕ್ಕರೆ ಕಡಿಮೆ ತಿನ್ನಿರಿ",
        "ರಾತ್ರಿ 7-8 ಗಂಟೆ ನಿದ್ರೆ ಮಾಡಿ",
        "ಹಸಿ ತರಕಾರಿ ಹೆಚ್ಚು ತಿನ್ನಿರಿ",
        "ಮನೆಯಲ್ಲಿ ಕೈ ಚೆನ್ನಾಗಿ ತೊಳೆಯಿರಿ",
        "ಧ್ಯಾನ ಮಾಡಿ, ಮನಸ್ಸು ಶಾಂತವಾಗಿರುತ್ತದೆ",
    ],
    hindi: [
        "रोज़ 8 गिलास पानी पिएं",
        "हर दिन 30 मिनट चलें",
        "चीनी कम खाएं",
        "रात को 7-8 घंटे सोएं",
        "ताजी सब्जियां ज्यादा खाएं",
        "घर में हाथ अच्छे से धोएं",
        "ध्यान करें, मन शांत रहेगा",
    ],
    english: [
        "Drink 8 glasses of water daily",
        "Walk 30 minutes every day",
        "Reduce sugar intake",
        "Sleep 7-8 hours at night",
        "Eat more fresh vegetables",
        "Wash hands properly at home",
        "Meditate for a peaceful mind",
    ],
    telugu: [
        "రోజుకు 8 గ్లాసుల నీళ్ళు తాగండి",
        "రోజూ 30 నిమిషాలు నడవండి",
        "చక్కెర తక్కువ తినండి",
        "రాత్రి 7-8 గంటలు నిద్రపోండి",
        "ఎక్కువ తాజా కూరగాయలు తినండి",
        "ఇంట్లో చేతులు బాగా కడగండి",
        "ధ్యానం చేయండి, మనసు ప్రశాంతంగా ఉంటుంది",
    ],
};

/**
 * Get today's health tip. Uses day of year as index.
 * Same tip all day, different each day. Pure math — no API.
 */
export function getTodaysTip(language: Language): string {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    
    const tips = healthTips[language] || healthTips.english;
    return tips[dayOfYear % tips.length];
}
