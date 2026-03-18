export type Message = {
    role: "user" | "assistant";
    text: string;
    language: string;
    timestamp: number;
};

export function saveMessage(role: "user" | "assistant", text: string, language: string) {
    if (typeof window === "undefined") return;

    try {
        const history = getHistory();
        const newMessage: Message = {
            role,
            text,
            language,
            timestamp: Date.now(),
        };

        const updatedHistory = [...history, newMessage].slice(-10); // Keep last 10
        localStorage.setItem("arogya_history", JSON.stringify(updatedHistory));
    } catch {
        // Ignore localStorage errors
    }
}

export function getHistory(): Message[] {
    if (typeof window === "undefined") return [];

    try {
        const stored = localStorage.getItem("arogya_history");
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

export function buildContext(clientHistory?: Message[]): string {
    const history = clientHistory || getHistory();
    if (!history || history.length === 0) return "";

    const lastFive = history.slice(-5);
    
    let contextStr = "Previous conversation:\n";
    for (const msg of lastFive) {
        const speaker = msg.role === "user" ? "Patient" : "Doctor";
        contextStr += `${speaker} said: ${msg.text}\n`;
    }
    
    return contextStr;
}

export function clearHistory() {
    if (typeof window === "undefined") return;
    localStorage.removeItem("arogya_history");
}
