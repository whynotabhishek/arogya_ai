"use client";

import { motion } from "framer-motion";
import { LoaderCircle, Mic, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

type OrbState = "idle" | "listening" | "thinking" | "speaking" | "emergency";

type VoiceOrbProps = {
    state?: OrbState;
    isListening: boolean;
    isProcessing: boolean;
    label: string;
    onToggle: () => void;
};

const stateColors: Record<OrbState, { primary: string; glow: string }> = {
    idle: { primary: "from-slate-400/20 to-slate-500/10", glow: "rgba(148,163,184,0.15)" },
    listening: { primary: "from-purple-500 to-indigo-600", glow: "rgba(168,85,247,0.4)" },
    thinking: { primary: "from-amber-500 to-orange-500", glow: "rgba(255,140,0,0.3)" },
    speaking: { primary: "from-emerald-400 to-teal-500", glow: "rgba(0,229,160,0.3)" },
    emergency: { primary: "from-red-500 to-red-700", glow: "rgba(255,68,68,0.5)" },
};

export function VoiceOrb({ state: forcedState, isListening, isProcessing, label, onToggle }: VoiceOrbProps) {
    const state: OrbState = forcedState ?? (isProcessing ? "thinking" : isListening ? "listening" : "idle");
    const colors = stateColors[state];
    const isActive = state !== "idle";

    return (
        <div className="mx-auto mt-6 flex flex-col items-center">
            <div className="relative flex items-center justify-center">
                {/* Ring 1 — inner glow */}
                <motion.div
                    animate={{
                        scale: isActive ? [1, 1.15, 1] : 1,
                        opacity: isActive ? [0.5, 0.2, 0.5] : 0,
                    }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute h-40 w-40 rounded-full"
                    style={{ background: `radial-gradient(circle, ${colors.glow}, transparent 70%)` }}
                />
                {/* Ring 2 */}
                <motion.div
                    animate={{
                        scale: isActive ? [1, 1.3, 1] : 1,
                        opacity: isActive ? [0.4, 0.1, 0.4] : 0,
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute h-48 w-48 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 blur-2xl"
                />
                {/* Ring 3 */}
                <motion.div
                    animate={{
                        scale: isActive ? [1, 1.8, 1] : 1,
                        opacity: isActive ? [0.2, 0, 0.2] : 0,
                    }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                    className="absolute h-48 w-48 rounded-full border border-purple-500/30"
                />
                {/* Ring 4 — outermost */}
                <motion.div
                    animate={{
                        scale: isActive ? [1, 2.2, 1] : 1,
                        opacity: isActive ? [0.1, 0, 0.1] : 0,
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                    className="absolute h-48 w-48 rounded-full border border-indigo-500/20"
                />

                {/* Main 140px Interactive Button */}
                <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onToggle}
                    className={cn(
                        "relative z-10 flex items-center justify-center overflow-hidden rounded-full transition-all duration-300",
                        "h-[140px] w-[140px]",
                        state === "listening"
                            ? "border border-purple-400/50 bg-purple-100 dark:bg-purple-900/40 shadow-[0_0_40px_rgba(168,85,247,0.4)]"
                            : state === "thinking"
                            ? "border border-amber-400/50 bg-amber-900/30 shadow-[0_0_40px_rgba(255,140,0,0.3)]"
                            : state === "speaking"
                            ? "border border-emerald-400/50 bg-emerald-900/30 shadow-[0_0_40px_rgba(0,229,160,0.3)]"
                            : state === "emergency"
                            ? "border border-red-400/50 bg-red-900/40 shadow-[0_0_60px_rgba(255,68,68,0.5)] animate-pulse"
                            : "border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:bg-slate-100 dark:hover:bg-white/10",
                    )}
                >
                    <div className="absolute inset-0 backdrop-blur-xl" />
                    <div className="relative z-20 flex h-full w-full flex-col items-center justify-center">
                        {isProcessing ? (
                            <LoaderCircle className="h-12 w-12 animate-spin text-[#FF8C00]" />
                        ) : state === "emergency" ? (
                            <Phone className="h-12 w-12 text-red-300" />
                        ) : (
                            <Mic
                                className={cn(
                                    "h-12 w-12 transition-colors duration-300",
                                    state === "listening" ? "text-purple-600 dark:text-purple-300" :
                                    state === "speaking" ? "text-emerald-400" :
                                    "text-slate-600 dark:text-white/80",
                                )}
                            />
                        )}
                        {!isProcessing && (
                            <span
                                className={cn(
                                    "mt-2 text-[10px] font-bold uppercase tracking-widest transition-colors duration-300",
                                    state === "listening" ? "text-purple-600 dark:text-purple-300" :
                                    state === "speaking" ? "text-emerald-400" :
                                    state === "emergency" ? "text-red-300" :
                                    "text-slate-500 dark:text-white/50",
                                )}
                            >
                                {state === "listening"
                                    ? "Listening"
                                    : state === "speaking"
                                    ? "Speaking"
                                    : state === "emergency"
                                    ? "EMERGENCY"
                                    : "Tap"}
                            </span>
                        )}
                    </div>
                </motion.button>
            </div>

            <motion.p
                animate={{ opacity: isActive ? 1 : 0.6 }}
                className="mt-8 text-sm font-medium tracking-wide text-slate-500 dark:text-white/60"
            >
                {label}
            </motion.p>
        </div>
    );
}
