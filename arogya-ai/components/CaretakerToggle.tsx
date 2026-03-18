"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { Language } from "@/lib/translations";
import { t } from "@/lib/translations";
import { vibrateSuccess } from "@/lib/haptics";

type CaretakerToggleProps = {
    language: Language;
    onCaretakerChange: (isCaretaker: boolean, patientAge: number) => void;
};

export function CaretakerToggle({ language, onCaretakerChange }: CaretakerToggleProps) {
    const [isCaretaker, setIsCaretaker] = useState(false);
    const [patientAge, setPatientAge] = useState(30);

    useEffect(() => {
        const stored = localStorage.getItem("arogya_caretaker");
        if (stored) {
            try {
                const data = JSON.parse(stored);
                setIsCaretaker(data.active || false);
                setPatientAge(data.age || 30);
            } catch { /* ignore */ }
        }
    }, []);

    const handleToggle = () => {
        const newState = !isCaretaker;
        setIsCaretaker(newState);
        vibrateSuccess();

        localStorage.setItem(
            "arogya_caretaker",
            JSON.stringify({ active: newState, age: patientAge })
        );
        onCaretakerChange(newState, patientAge);
    };

    const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const age = parseInt(e.target.value);
        setPatientAge(age);
        localStorage.setItem(
            "arogya_caretaker",
            JSON.stringify({ active: isCaretaker, age })
        );
        onCaretakerChange(isCaretaker, age);
    };

    return (
        <div className="flex items-center gap-2">
            <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleToggle}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all min-h-[36px]"
                style={{
                    background: isCaretaker
                        ? "rgba(255,140,0,0.15)"
                        : "rgba(255,255,255,0.05)",
                    border: isCaretaker
                        ? "1px solid rgba(255,140,0,0.3)"
                        : "1px solid rgba(255,255,255,0.1)",
                    color: isCaretaker ? "#FF8C00" : "rgba(255,255,255,0.6)",
                }}
            >
                {isCaretaker ? "👥" : "👤"}
                <span>
                    {isCaretaker
                        ? t("caretakerMode", language)
                        : t("myselfMode", language)}
                </span>
            </motion.button>

            {isCaretaker && (
                <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="flex items-center gap-1.5 overflow-hidden"
                >
                    <span className="text-[10px] text-white/40 whitespace-nowrap">
                        {t("patientAge", language)}:
                    </span>
                    <input
                        type="range"
                        min="1"
                        max="100"
                        value={patientAge}
                        onChange={handleAgeChange}
                        className="w-16 h-1 accent-[#FF8C00] cursor-pointer"
                    />
                    <span className="text-[11px] font-bold text-[#FF8C00] min-w-[24px]">
                        {patientAge}
                    </span>
                </motion.div>
            )}
        </div>
    );
}
