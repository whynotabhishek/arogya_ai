type SymptomEntry = {
    symptom: string;
    severity: string;
    timestamp: number;
    count: number;
};

// Use node/server-friendly cache to avoid localStorage in API routes
// Or we pass the symptoms from the client-side.
// The instructions say "Pure localStorage tracking - no API" but then
// "Integrate into app/api/voice/route.ts".
// In Next.js App Router, localStorage does not exist in the API route.
// To satisfy the exact requirements, we should ideally pass the symptom map
// from the client to the API, OR run the tracker logic strictly on the client
// after receiving the response, OR do an in-memory map on the server if the user meant server.
// The prompt specifies "Store in localStorage key 'arogya_symptoms'".
// This means we must track it on the CLIENT, so integration into app/api/voice/route.ts
// isn't physically possible with localStorage unless we pass it via request body.
// I will implement it such that the client can read/write it, and the API can accept it.

export function trackSymptom(symptom: string, severity: string, existingTrackedMap?: SymptomEntry[]): SymptomEntry[] {
    const list = existingTrackedMap || _getLocalSymptoms();
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    // Filter out old ones
    const active = list.filter(s => s.timestamp > sevenDaysAgo);
    
    // Check if symptoms matches loosely
    const existing = active.find(s => s.symptom.toLowerCase().includes(symptom.toLowerCase()) || symptom.toLowerCase().includes(s.symptom.toLowerCase()));

    if (existing) {
        existing.count += 1;
        existing.timestamp = Date.now();
        existing.severity = severity;
    } else {
        active.push({
            symptom,
            severity,
            count: 1,
            timestamp: Date.now()
        });
    }

    if (typeof window !== "undefined") {
        localStorage.setItem("arogya_symptoms", JSON.stringify(active));
    }

    return active;
}

export function getSymptomFrequency(symptom: string, existingTrackedMap?: SymptomEntry[]): number {
    const list = existingTrackedMap || _getLocalSymptoms();
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    
    const active = list.filter(s => s.timestamp > sevenDaysAgo);
    const existing = active.find(s => s.symptom.toLowerCase().includes(symptom.toLowerCase()) || symptom.toLowerCase().includes(s.symptom.toLowerCase()));
    
    return existing ? existing.count : 0;
}

export function checkEscalation(symptom: string, existingTrackedMap?: SymptomEntry[]): boolean {
    const freq = getSymptomFrequency(symptom, existingTrackedMap);
    return freq >= 3;
}

export function getClientSymptomsTracker(): SymptomEntry[] {
    return _getLocalSymptoms();
}

function _getLocalSymptoms(): SymptomEntry[] {
    if (typeof window === "undefined") return [];
    try {
        const stored = localStorage.getItem("arogya_symptoms");
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}
