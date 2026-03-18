export type EmergencyRule = {
    action: string;
    severity: "critical" | "high";
};

export function checkEmergencyRules(symptomText: string): EmergencyRule | null {
    const text = symptomText.toLowerCase();

    // CARDIAC
    const cardiacKeywords = ["chest pain", "ಎದೆ ನೋವು", "सीने में दर्द", "left arm pain", "jaw pain", "sweating"];
    const cardiacMatches = cardiacKeywords.filter(k => text.includes(k.toLowerCase()));
    if (cardiacMatches.length >= 2) {
        return { action: "cardiac_emergency", severity: "critical" };
    }

    // STROKE
    const strokeKeywords = ["face drooping", "arm weakness", "speech", "ಮುಖ ವಾಲುವುದು", "sudden headache"];
    const strokeMatches = strokeKeywords.filter(k => text.includes(k.toLowerCase()));
    if (strokeMatches.length >= 2) {
        return { action: "stroke_emergency", severity: "critical" };
    }

    // BREATHING
    const breathingKeywords = ["can't breathe", "ಉಸಿರಾಟ", "chest tight", "सांस नहीं", "choking"];
    const breathingMatches = breathingKeywords.filter(k => text.includes(k.toLowerCase()));
    if (breathingMatches.length >= 1) {
        return { action: "breathing_emergency", severity: "critical" };
    }

    // SEVERE FEVER
    const feverKeywords = ["high fever", "104", "105", "seizure", "ತೀವ್ರ ಜ್ವರ", "fits"];
    const feverMatches = feverKeywords.filter(k => text.includes(k.toLowerCase()));
    if (feverMatches.length >= 1) {
        return { action: "fever_emergency", severity: "high" };
    }

    return null;
}
