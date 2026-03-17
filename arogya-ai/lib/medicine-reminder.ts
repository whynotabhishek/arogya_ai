export function scheduleMedicineReminder(medicineName: string, dosageHours: number, language: string): string {
    if (typeof window === "undefined" || !("Notification" in window)) return "";

    const id = Date.now().toString();

    if (Notification.permission === "granted") {
        createReminder(id, medicineName, dosageHours, language);
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
            if (permission === "granted") {
                createReminder(id, medicineName, dosageHours, language);
            }
        });
    }

    return id;
}

function createReminder(id: string, medicineName: string, dosageHours: number, language: string) {
    const timeMs = dosageHours * 60 * 60 * 1000;
    
    const timeoutId = setTimeout(() => {
        let text = "Medicine time! Take your " + medicineName;
        if (language === "kannada") text = "ಮಾತ್ರೆ ಸಮಯ! " + medicineName + " ತೆಗೆಕೊಳ್ಳಿ";
        if (language === "hindi") text = "दवाई का समय! " + medicineName + " लें";
        if (language === "telugu") text = "మందు సమయం! మీ " + medicineName + " తీసుకోండి";

        new Notification(text, {
            icon: "💊",
            body: "Arogya AI Reminder"
        });

        // Clean up from local storage if needed
        removeActiveReminder(id);
    }, timeMs);

    // Save to active reminders
    const reminders = getActiveReminders();
    reminders.push({ id, medicineName, dosageHours, timeoutId: Number(timeoutId) });
    localStorage.setItem("arogya_reminders", JSON.stringify(reminders));
}

export function cancelReminder(id: string) {
    if (typeof window === "undefined") return;
    const reminders = getActiveReminders();
    const toCancel = reminders.find(r => r.id === id);
    if (toCancel && toCancel.timeoutId) {
        clearTimeout(toCancel.timeoutId);
    }
    removeActiveReminder(id);
}

function getActiveReminders(): any[] {
    if (typeof window === "undefined") return [];
    try {
        const stored = localStorage.getItem("arogya_reminders");
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

function removeActiveReminder(id: string) {
    if (typeof window === "undefined") return;
    const reminders = getActiveReminders().filter(r => r.id !== id);
    localStorage.setItem("arogya_reminders", JSON.stringify(reminders));
}
