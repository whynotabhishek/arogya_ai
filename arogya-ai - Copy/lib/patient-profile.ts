export type PatientProfile = {
    name: string;
    age: number;
    language: string;
    chronicConditions: string[];
    emergencyContact: string;
    bloodGroup: string;
    createdAt: string;
};

export function savePatientProfile(profile: PatientProfile): void {
    if (typeof window === "undefined") return;
    localStorage.setItem("arogya_profile", JSON.stringify(profile));
}

export function getPatientProfile(): PatientProfile | null {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem("arogya_profile");
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch {
            return null;
        }
    }
    return null;
}
