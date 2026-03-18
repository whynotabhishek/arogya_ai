export function vibrateSuccess(): void {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(50);
    }
}

export function vibrateWarning(): void {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([100, 50, 100]);
    }
}

export function vibrateEmergency(): void {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([300, 100, 300, 100, 300]);
    }
}

export function vibrateTap(): void {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(30);
    }
}
