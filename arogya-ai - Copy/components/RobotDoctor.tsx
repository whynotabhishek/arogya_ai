"use client";

import { motion } from "framer-motion";

type RobotDoctorProps = {
    isListening: boolean;
    isSpeaking: boolean;
    onlineLabel: string;
};

export function RobotDoctor({ isListening, isSpeaking, onlineLabel }: RobotDoctorProps) {
    const active = isListening || isSpeaking;

    return (
        <div className="relative mx-auto w-full max-w-[280px] py-4">
            <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                className="relative flex justify-center"
            >
                <div className="absolute left-1/2 top-1/2 -z-10 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.15),transparent_70%)] blur-2xl flex items-center justify-center" />

                <svg
                    viewBox="0 0 300 300"
                    className="h-auto w-[240px] drop-shadow-[0_10px_30px_rgba(59,130,246,0.2)]"
                    role="img"
                    aria-label="Cute AI Doctor"
                >
                    <defs>
                        <linearGradient id="docBody" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#ffffff" />
                            <stop offset="100%" stopColor="#f8fafc" />
                        </linearGradient>
                        <linearGradient id="docShadow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="rgba(0,0,0,0.0)" />
                            <stop offset="100%" stopColor="rgba(0,0,0,0.06)" />
                        </linearGradient>
                    </defs>

                    {/* Body / Coat */}
                    <path
                        d="M60 280 C60 180, 80 140, 150 140 C220 140, 240 180, 240 280 Z"
                        fill="url(#docBody)"
                    />
                    <path
                        d="M60 280 C60 180, 80 140, 150 140 C220 140, 240 180, 240 280 Z"
                        fill="url(#docShadow)"
                    />

                    {/* Stethoscope Neck */}
                    <path d="M100 150 C100 220, 200 220, 200 150" fill="none" stroke="#334155" strokeWidth="12" strokeLinecap="round" />
                    <path d="M200 160 L200 220" fill="none" stroke="#334155" strokeWidth="10" strokeLinecap="round" />
                    <circle cx="200" cy="235" r="15" fill="#e2e8f0" stroke="#334155" strokeWidth="8" />
                    
                    {/* Head */}
                    <rect x="80" y="40" width="140" height="120" rx="60" fill="#fde68a" />
                    
                    {/* Hair / Headpiece */}
                    <path d="M80 100 C80 20, 220 20, 220 100 C200 80, 100 80, 80 100 Z" fill="#38bdf8" />
                    
                    {/* Medical Cross on Head */}
                    <rect x="138" y="30" width="24" height="24" rx="12" fill="#ffffff" />
                    <rect x="146" y="36" width="8" height="12" rx="2" fill="#ef4444" />
                    <rect x="144" y="40" width="12" height="4" rx="1" fill="#ef4444" />

                    {/* Eyes */}
                    {isListening ? (
                        <g>
                            <path d="M110 100 Q120 90 130 100" fill="none" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
                            <path d="M170 100 Q180 90 190 100" fill="none" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
                        </g>
                    ) : (
                        <g>
                            <circle cx="120" cy="95" r="9" fill="#334155" className="animate-[blink_4s_infinite]" />
                            <circle cx="180" cy="95" r="9" fill="#334155" className="animate-[blink_4s_infinite]" />
                        </g>
                    )}

                    {/* Cheeks */}
                    <circle cx="100" cy="110" r="10" fill="#fca5a5" opacity="0.5" />
                    <circle cx="200" cy="110" r="10" fill="#fca5a5" opacity="0.5" />

                    {/* Mouth - Animates when speaking */}
                    {isSpeaking ? (
                        <rect x="135" y="115" width="30" height="15" rx="7.5" fill="#ef4444" className="animate-pulse" />
                    ) : (
                        <path d="M140 120 Q150 130 160 120" fill="none" stroke="#334155" strokeWidth="5" strokeLinecap="round" />
                    )}
                </svg>

                {/* Glowing Aura if speaking/listening */}
                {active && (
                    <span className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-blue-400/10 blur-[40px] animate-pulse" />
                )}
            </motion.div>

            <div className="mt-4 flex items-center justify-center gap-2 text-sm font-bold text-blue-500 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-900/30 px-4 py-2 rounded-full w-fit mx-auto border border-blue-200 dark:border-blue-800/50 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 dark:bg-blue-300 opacity-70" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500 dark:bg-blue-400" />
                </span>
                <span>Dr. Arogya · {onlineLabel.split(' · ')[1]}</span>
            </div>
        </div>
    );
}
