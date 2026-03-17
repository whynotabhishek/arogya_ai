import { useState, useEffect, useCallback } from "react";

export type EmergencyResponse = {
    success: boolean;
    action?: string;
    message?: string;
    error?: string;
};

export function useEmergencyAlert() {
    const [isLoading, setIsLoading] = useState(false);
    const [locationGranted, setLocationGranted] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [emergencyTriggered, setEmergencyTriggered] = useState(false);
    const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

    useEffect(() => {
        if (!navigator.geolocation) {
            setLocationError("Geolocation is not supported by your browser");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setCoordinates({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                });
                setLocationGranted(true);
                setLocationError(null);
            },
            (error) => {
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        setLocationError("permission denied");
                        break;
                    case error.POSITION_UNAVAILABLE:
                        setLocationError("location unavailable");
                        break;
                    case error.TIMEOUT:
                        setLocationError("location timeout");
                        break;
                    default:
                        setLocationError("unknown error");
                        break;
                }
                setLocationGranted(false);
            },
            { timeout: 10000 }
        );
    }, []);

    const triggerEmergency = useCallback(
        async (translatedSymptom: string, language: string = "english"): Promise<EmergencyResponse> => {
            setIsLoading(true);
            setEmergencyTriggered(false);

            try {
                const response = await fetch("/api/alert", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        symptom: translatedSymptom,
                        lat: coordinates?.lat || null,
                        lng: coordinates?.lng || null,
                        timestamp: new Date().toISOString(),
                        language,
                    }),
                });

                const data = (await response.json()) as EmergencyResponse;

                if (data.success) {
                    setEmergencyTriggered(true);
                }

                return data;
            } catch (error) {
                console.error("Emergency alert failed to trigger:", error);
                return { success: false, error: "Alert failed" };
            } finally {
                setIsLoading(false);
            }
        },
        [coordinates]
    );

    return {
        isLoading,
        locationGranted,
        locationError,
        emergencyTriggered,
        triggerEmergency,
    };
}
