export type PatientProfile = {
    name: string;
    age: number;
    language: string;
    chronicConditions: string[];
    emergencyContact: string;
    bloodGroup: string;
    createdAt: string;
};

type ConversationMessage = {
    role?: string;
    text?: string;
};

export function calculateRiskScore(
    patientProfile: PatientProfile | null,
    symptomHistory: any[],
    history: ConversationMessage[] = [],
): number {
    let score = 0;

    if (patientProfile && patientProfile.age > 60) {
        score += 20;
    }

    // Check recent symptoms severity
    let redCount = 0;
    let sameSymptomCount = 0; // Requires looking at how symptomHistory is formatted
    // Assuming symptomHistory has { severity, count }
    for (const entry of symptomHistory || []) {
        if (entry.severity === "high" || entry.severity === "urgent" || entry.severity === "critical") {
            redCount++;
        }
        if (entry.count && entry.count >= 3) {
            sameSymptomCount++;
        }
    }

    if (redCount > 0) score += 30;
    if (sameSymptomCount > 0) score += 25;

    if (patientProfile && patientProfile.chronicConditions && patientProfile.chronicConditions.length > 0 && !patientProfile.chronicConditions.includes("None")) {
        score += 15;
    }

    if (patientProfile?.emergencyContact) {
        score -= 5;
    }

    // Default assume no doctor visit if they are repeatedly asking
    if (sameSymptomCount > 0) {
        score += 10;
    }

    const recentUserMessages = (history || [])
        .filter((entry) => entry?.role === "user" && typeof entry?.text === "string")
        .slice(-6)
        .map((entry) => entry.text!.toLowerCase());

    const dangerSignals = [
        "chest pain",
        "breathing",
        "shortness of breath",
        "faint",
        "blood",
        "severe",
        "vomit",
        "high fever",
        "stroke",
        "fits",
    ];

    const dangerHits = recentUserMessages.reduce((hits, message) => {
        if (dangerSignals.some((keyword) => message.includes(keyword))) {
            return hits + 1;
        }
        return hits;
    }, 0);

    if (dangerHits > 0) {
        score += Math.min(20, dangerHits * 7);
    }

    return Math.max(0, Math.min(100, score));
}

export function getRiskLevel(score: number): "low" | "moderate" | "high" | "critical" {
    if (score <= 25) return "low";
    if (score <= 50) return "moderate";
    if (score <= 75) return "high";
    return "critical";
}

export function saveRiskScore(score: number): void {
    if (typeof window === "undefined") return;
    localStorage.setItem("arogya_risk", score.toString());
}

export function getStoredRiskScore(): number {
    if (typeof window === "undefined") return 0;
    const stored = localStorage.getItem("arogya_risk");
    if (stored) return parseInt(stored, 10) || 0;
    return 0;
}
