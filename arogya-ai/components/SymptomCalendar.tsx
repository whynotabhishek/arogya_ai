"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Language } from "@/lib/translations";
import { t } from "@/lib/translations";

type SymptomEntry = {
    symptom: string;
    severity: string;
    timestamp: number;
    count: number;
};

const severityColorMap: Record<string, string> = {
    safe: "#00E5A0",
    caution: "#F59E0B",
    urgent: "#FF4444",
    critical: "#CC0000",
};

type SymptomCalendarProps = {
    language: Language;
};

export function SymptomCalendar({ language }: SymptomCalendarProps) {
    const [symptoms, setSymptoms] = useState<SymptomEntry[]>([]);
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const [currentMonth, setCurrentMonth] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    });

    useEffect(() => {
        try {
            const stored = localStorage.getItem("arogya_symptoms");
            if (stored) {
                setSymptoms(JSON.parse(stored));
            }
        } catch { /* */ }
    }, []);

    const daysInMonth = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        return new Date(year, month + 1, 0).getDate();
    }, [currentMonth]);

    const firstDayOfWeek = useMemo(() => {
        return currentMonth.getDay();
    }, [currentMonth]);

    const getSymptomForDay = (day: number): SymptomEntry | null => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const dayStart = new Date(year, month, day).getTime();
        const dayEnd = dayStart + 24 * 60 * 60 * 1000;

        return symptoms.find((s) => s.timestamp >= dayStart && s.timestamp < dayEnd) ?? null;
    };

    const selectedSymptom = selectedDay ? getSymptomForDay(selectedDay) : null;

    const prevMonth = () => {
        setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
        setSelectedDay(null);
    };

    const nextMonth = () => {
        setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
        setSelectedDay(null);
    };

    const monthLabel = currentMonth.toLocaleDateString(
        language === "kannada" ? "kn-IN" : language === "hindi" ? "hi-IN" : language === "telugu" ? "te-IN" : "en-IN",
        { month: "long", year: "numeric" }
    );

    return (
        <div
            className="rounded-[20px] border overflow-hidden w-full max-w-[500px] mx-auto"
            style={{
                background: "rgba(13,21,37,0.95)",
                borderColor: "rgba(255,255,255,0.08)",
            }}
        >
            <div className="p-5">
                <h2
                    className="text-lg font-bold text-white mb-4 text-center"
                    style={{ fontFamily: "'Syne', sans-serif" }}
                >
                    {t("calendarTitle", language)}
                </h2>

                {/* Month navigation */}
                <div className="flex items-center justify-between mb-4">
                    <button onClick={prevMonth} className="text-white/40 hover:text-white text-xl px-2 py-1">←</button>
                    <span className="text-sm font-semibold text-white/80">{monthLabel}</span>
                    <button onClick={nextMonth} className="text-white/40 hover:text-white text-xl px-2 py-1">→</button>
                </div>

                {/* Days of week header */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                        <div key={i} className="text-center text-[10px] font-bold text-white/30 uppercase">
                            {d}
                        </div>
                    ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                        <div key={`empty-${i}`} className="h-10" />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const symptom = getSymptomForDay(day);
                        const isSelected = selectedDay === day;
                        const today = new Date();
                        const isToday =
                            today.getDate() === day &&
                            today.getMonth() === currentMonth.getMonth() &&
                            today.getFullYear() === currentMonth.getFullYear();

                        return (
                            <motion.button
                                key={day}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setSelectedDay(day)}
                                className={`relative h-10 w-full rounded-lg text-sm font-medium transition-all ${
                                    isSelected
                                        ? "ring-2 ring-[#FF8C00]"
                                        : ""
                                } ${isToday ? "font-bold" : ""}`}
                                style={{
                                    background: symptom
                                        ? `${severityColorMap[symptom.severity] || severityColorMap.caution}20`
                                        : "rgba(255,255,255,0.02)",
                                    border: symptom
                                        ? `1px solid ${severityColorMap[symptom.severity] || severityColorMap.caution}40`
                                        : "1px solid transparent",
                                    color: symptom
                                        ? severityColorMap[symptom.severity] || severityColorMap.caution
                                        : "rgba(255,255,255,0.5)",
                                }}
                            >
                                {day}
                                {symptom && (
                                    <span
                                        className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full"
                                        style={{
                                            background: severityColorMap[symptom.severity] || severityColorMap.caution,
                                        }}
                                    />
                                )}
                            </motion.button>
                        );
                    })}
                </div>

                {/* Selected day detail */}
                <AnimatePresence>
                    {selectedDay && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 overflow-hidden"
                        >
                            <div
                                className="p-4 rounded-2xl"
                                style={{
                                    background: selectedSymptom
                                        ? `${severityColorMap[selectedSymptom.severity] || severityColorMap.caution}08`
                                        : "rgba(255,255,255,0.02)",
                                    border: `1px solid ${selectedSymptom
                                        ? `${severityColorMap[selectedSymptom.severity] || severityColorMap.caution}30`
                                        : "rgba(255,255,255,0.06)"}`,
                                }}
                            >
                                {selectedSymptom ? (
                                    <>
                                        <p className="text-sm font-bold text-white/90 mb-1">
                                            {selectedSymptom.symptom}
                                        </p>
                                        <p className="text-xs text-white/50">
                                            Severity: {selectedSymptom.severity} · Reported {selectedSymptom.count}x
                                        </p>
                                        <p className="text-xs text-white/40 mt-1">
                                            {new Date(selectedSymptom.timestamp).toLocaleString()}
                                        </p>
                                    </>
                                ) : (
                                    <p className="text-sm text-white/40 text-center">
                                        {t("noSymptoms", language)}
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
