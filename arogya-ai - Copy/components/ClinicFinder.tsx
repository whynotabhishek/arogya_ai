"use client";

import { motion } from "framer-motion";
import { Crosshair, MapPin } from "lucide-react";

type Clinic = {
    name: string;
    district: string;
    timing: string;
    phone: string;
    distanceKm?: number;
};

type ClinicFinderProps = {
    label: string;
    sublabel: string;
    permissionDeniedLabel: string;
    onClinicFound: (clinic: Clinic) => void;
    onFriendlyError: (message: string) => void;
};

export function ClinicFinder({
    label,
    sublabel,
    permissionDeniedLabel,
    onClinicFound,
    onFriendlyError,
}: ClinicFinderProps) {
    const findClinic = () => {
        if (!navigator.geolocation) {
            onFriendlyError(permissionDeniedLabel);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const response = await fetch("/api/clinic", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            lat: position.coords.latitude,
                            lng: position.coords.longitude,
                        }),
                    });

                    const payload = (await response.json()) as { clinic?: Clinic; error?: string };
                    if (!response.ok || !payload.clinic) {
                        throw new Error(payload.error || "Clinic lookup failed");
                    }

                    onClinicFound(payload.clinic);
                } catch {
                    onFriendlyError("Unable to find clinic right now. Please try again.");
                }
            },
            () => onFriendlyError(permissionDeniedLabel),
            { enableHighAccuracy: true, timeout: 10000 },
        );
    };

    return (
        <motion.button
            id="clinic-finder-btn"
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={findClinic}
            className="group relative flex min-h-12 w-full items-center justify-start gap-3 rounded-[18px] border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-800/60 px-4 py-3 text-left transition-all duration-300 hover:border-pink-300 dark:hover:border-pink-500/40 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:shadow-[0_0_20px_rgba(236,72,153,0.1)] dark:hover:shadow-[0_0_20px_rgba(236,72,153,0.15)] shadow-sm dark:shadow-none backdrop-blur-md"
        >
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-pink-100 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400 group-hover:bg-pink-200 dark:group-hover:bg-pink-500/20 group-hover:text-pink-700 dark:group-hover:text-pink-300 transition-colors">
                <MapPin className="h-5 w-5" />
                <Crosshair className="absolute -bottom-0.5 -right-0.5 h-3 w-3 text-pink-500 dark:text-pink-300" />
            </div>
            <div className="leading-tight">
                <p className="text-sm font-semibold tracking-wide text-slate-800 dark:text-white">{label}</p>
                <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">{sublabel}</p>
            </div>
        </motion.button>
    );
}
