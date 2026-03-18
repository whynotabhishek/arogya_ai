"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Language } from "@/lib/translations";
import { t } from "@/lib/translations";
import { vibrateSuccess } from "@/lib/haptics";

type BodyRegion = "head" | "chest" | "stomach" | "back" | "arms" | "fullBody";

type BodyMapProps = {
    language: Language;
    onRegionSelect: (region: BodyRegion) => void;
    onClose: () => void;
};

const regionLabels: Record<BodyRegion, { key: string; mcqCategory: string }> = {
    head: { key: "head", mcqCategory: "headache" },
    chest: { key: "chest", mcqCategory: "chest" },
    stomach: { key: "stomach", mcqCategory: "stomach" },
    back: { key: "back", mcqCategory: "general" },
    arms: { key: "arms", mcqCategory: "general" },
    fullBody: { key: "fullBody", mcqCategory: "fever" },
};

export function BodyMap({ language, onRegionSelect, onClose }: BodyMapProps) {
    const [hoveredRegion, setHoveredRegion] = useState<BodyRegion | null>(null);
    const [tappedRegion, setTappedRegion] = useState<BodyRegion | null>(null);

    const handleTap = (region: BodyRegion) => {
        setTappedRegion(region);
        vibrateSuccess();
        setTimeout(() => {
            onRegionSelect(region);
        }, 300);
    };

    const getRegionStyle = (region: BodyRegion) => {
        const isHovered = hoveredRegion === region;
        const isTapped = tappedRegion === region;
        return {
            fill: isTapped
                ? "rgba(255,140,0,0.3)"
                : isHovered
                ? "rgba(255,140,0,0.15)"
                : "transparent",
            stroke: isHovered || isTapped ? "#FF8C00" : "rgba(255,255,255,0.15)",
            strokeWidth: isHovered || isTapped ? 2 : 1,
            cursor: "pointer" as const,
        };
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-[400px] mx-auto"
            >
                <div
                    className="rounded-[20px] border overflow-hidden"
                    style={{
                        background: "rgba(13,21,37,0.95)",
                        borderColor: "rgba(255,255,255,0.08)",
                    }}
                >
                    <div className="p-5">
                        {/* Title */}
                        <div className="flex items-center justify-between mb-4">
                            <p
                                className="text-base font-semibold text-white"
                                style={{ fontFamily: "'Syne', sans-serif" }}
                            >
                                {t("bodyMapTitle", language)}
                            </p>
                            <button
                                onClick={onClose}
                                className="text-white/40 hover:text-white/70 text-sm transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Body SVG */}
                        <div className="flex justify-center">
                            <svg
                                viewBox="0 0 200 400"
                                className="w-[180px] h-auto"
                                role="img"
                                aria-label={t("tapBody", language)}
                            >
                                {/* Body outline */}
                                <ellipse cx="100" cy="50" rx="30" ry="35" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                                <line x1="100" y1="85" x2="100" y2="220" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                                <line x1="100" y1="110" x2="45" y2="180" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                                <line x1="100" y1="110" x2="155" y2="180" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                                <line x1="100" y1="220" x2="65" y2="370" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                                <line x1="100" y1="220" x2="135" y2="370" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />

                                {/* Clickable regions */}
                                {/* Head */}
                                <motion.ellipse
                                    cx="100" cy="50" rx="32" ry="37"
                                    {...getRegionStyle("head")}
                                    onMouseEnter={() => setHoveredRegion("head")}
                                    onMouseLeave={() => setHoveredRegion(null)}
                                    onClick={() => handleTap("head")}
                                    whileTap={{ scale: 0.95 }}
                                />
                                {/* Chest */}
                                <motion.rect
                                    x="70" y="90" width="60" height="50" rx="8"
                                    {...getRegionStyle("chest")}
                                    onMouseEnter={() => setHoveredRegion("chest")}
                                    onMouseLeave={() => setHoveredRegion(null)}
                                    onClick={() => handleTap("chest")}
                                    whileTap={{ scale: 0.95 }}
                                />
                                {/* Stomach */}
                                <motion.rect
                                    x="72" y="145" width="56" height="50" rx="8"
                                    {...getRegionStyle("stomach")}
                                    onMouseEnter={() => setHoveredRegion("stomach")}
                                    onMouseLeave={() => setHoveredRegion(null)}
                                    onClick={() => handleTap("stomach")}
                                    whileTap={{ scale: 0.95 }}
                                />
                                {/* Arms (left + right combined) */}
                                <motion.rect
                                    x="30" y="110" width="35" height="80" rx="8"
                                    {...getRegionStyle("arms")}
                                    onMouseEnter={() => setHoveredRegion("arms")}
                                    onMouseLeave={() => setHoveredRegion(null)}
                                    onClick={() => handleTap("arms")}
                                    whileTap={{ scale: 0.95 }}
                                />
                                <motion.rect
                                    x="135" y="110" width="35" height="80" rx="8"
                                    {...getRegionStyle("arms")}
                                    onMouseEnter={() => setHoveredRegion("arms")}
                                    onMouseLeave={() => setHoveredRegion(null)}
                                    onClick={() => handleTap("arms")}
                                    whileTap={{ scale: 0.95 }}
                                />

                                {/* Labels */}
                                <text x="100" y="55" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.5)" fontWeight="600">{t("head", language)}</text>
                                <text x="100" y="118" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.5)" fontWeight="600">{t("chest", language)}</text>
                                <text x="100" y="174" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.5)" fontWeight="600">{t("stomach", language)}</text>
                            </svg>
                        </div>

                        {/* Full body / Fever button */}
                        <div className="flex justify-center gap-3 mt-4">
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleTap("fullBody")}
                                className="px-4 py-2.5 rounded-xl text-sm font-medium min-h-[48px]"
                                style={{
                                    background: "rgba(255,140,0,0.08)",
                                    border: "1px solid rgba(255,140,0,0.2)",
                                    color: "#FF8C00",
                                }}
                            >
                                🤒 {t("fullBody", language)}
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleTap("back")}
                                className="px-4 py-2.5 rounded-xl text-sm font-medium min-h-[48px]"
                                style={{
                                    background: "rgba(255,255,255,0.04)",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    color: "rgba(255,255,255,0.7)",
                                }}
                            >
                                🔙 {t("back", language)}
                            </motion.button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

export { regionLabels };
export type { BodyRegion };
