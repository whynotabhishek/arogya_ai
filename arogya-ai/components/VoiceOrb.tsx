"use client";

import { motion } from "framer-motion";
import { LoaderCircle, Mic } from "lucide-react";
import { cn } from "@/lib/utils";

type VoiceOrbProps = {
    isListening: boolean;
    isProcessing: boolean;
    label: string;
    onToggle: () => void;
};

export function VoiceOrb({ isListening, isProcessing, label, onToggle }: VoiceOrbProps) {
    return (
        <div className="mx-auto mt-6 flex flex-col items-center">
            <div className="relative flex items-center justify-center">
                {/* Outer Glow / Pulse Animations */}
                <motion.div
                    animate={{
                        scale: isListening ? [1, 1.3, 1] : 1,
                        opacity: isListening ? [0.4, 0.1, 0.4] : 0,
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    className="absolute h-48 w-48 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 blur-2xl"
                />

                <motion.div
                    animate={{
                        scale: isListening ? [1, 1.8, 1] : 1,
                        opacity: isListening ? [0.2, 0, 0.2] : 0,
                    }}
                    transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.2,
                    }}
                    className="absolute h-48 w-48 rounded-full border border-purple-500/30"
                />

                <motion.div
                    animate={{
                        scale: isListening ? [1, 2.2, 1] : 1,
                        opacity: isListening ? [0.1, 0, 0.1] : 0,
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.4,
                    }}
                    className="absolute h-48 w-48 rounded-full border border-indigo-500/20"
                />

                {/* Main Interactive Button */}
                <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onToggle}
                    className={cn(
                        "relative z-10 flex h-36 w-36 items-center justify-center overflow-hidden rounded-full transition-all duration-300",
                        isListening
                            ? "border border-purple-400/50 bg-purple-100 dark:bg-purple-900/40 shadow-[0_0_40px_rgba(168,85,247,0.4)]"
                            : "border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:bg-slate-100 dark:hover:bg-white/10",
                    )}
                >
                    {/* Glassmorphic backdrop */}
                    <div className="absolute inset-0 backdrop-blur-xl" />

                    {/* Button content */}
                    <div className="relative z-20 flex h-full w-full flex-col items-center justify-center">
                        {isProcessing ? (
                            <LoaderCircle className="h-10 w-10 animate-spin text-purple-400" />
                        ) : (
                            <Mic
                                className={cn(
                                    "h-10 w-10 transition-colors duration-300",
                                    isListening ? "text-purple-600 dark:text-purple-300" : "text-slate-600 dark:text-white/80",
                                )}
                            />
                        )}
                        {!isProcessing && (
                            <span
                                className={cn(
                                    "mt-2 text-[10px] font-bold uppercase tracking-widest transition-colors duration-300",
                                    isListening ? "text-purple-600 dark:text-purple-300" : "text-slate-500 dark:text-white/50",
                                )}
                            >
                                {isListening ? "Listening" : "Tap"}
                            </span>
                        )}
                    </div>
                </motion.button>
            </div>

            <motion.p
                animate={{ opacity: isListening ? 1 : 0.6 }}
                className="mt-8 text-sm font-medium tracking-wide text-slate-500 dark:text-white/60"
            >
                {label}
            </motion.p>
        </div>
    );
}
