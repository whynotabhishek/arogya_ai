"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Cross, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import type { SupportedLanguage } from "@/prompts/health";
import { STRINGS } from "@/lib/i18n";

type LanguageScreenProps = {
    onSelect: (language: SupportedLanguage) => void;
};

type LanguageCard = {
    key: SupportedLanguage;
    script: string;
    name: string;
};

const active: LanguageCard[] = [
    { key: "kannada", script: "ಕನ್ನಡ", name: "Kannada" },
    { key: "hindi", script: "हिंदी", name: "Hindi" },
    { key: "telugu", script: "తెలుగు", name: "Telugu" },
    { key: "english", script: "English", name: "English" },
];

const comingSoon = ["தமிழ்", "मराठी", "বাংলা", "ਪੰਜਾਬੀ", "മലയാളം"];

export function LanguageScreen({ onSelect }: LanguageScreenProps) {
    const [selected, setSelected] = useState<SupportedLanguage | null>(null);
    const [shakeIndex, setShakeIndex] = useState<number | null>(null);
    const [dots, setDots] = useState<{ id: number; left: string; top: string; size: number; duration: number; delay: number }[]>([]);

    useEffect(() => {
        setDots(
            Array.from({ length: 14 }).map((_, i) => ({
                id: i,
                left: `${7 + ((i * 13) % 86)}%`,
                top: `${8 + ((i * 17) % 82)}%`,
                size: 2 + (i % 3),
                duration: 8 + (i % 7),
                delay: (i % 5) * 0.8,
            }))
        );
    }, []);

    const router = useRouter()
    const selectLanguage = (language: SupportedLanguage) => {
        setSelected(language);
        localStorage.setItem("arogya_language", language);
        onSelect(language);
        // Navigate back to the hero page
        router.push('/');
    };

    return (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative min-h-screen overflow-hidden bg-slate-50 px-6 pb-12 pt-10 selection:bg-indigo-500/20"
        >
            <div className="pointer-events-none absolute inset-0 z-0">
                {dots.map((dot) => (
                    <span
                        key={dot.id}
                        className="absolute rounded-full bg-indigo-200"
                        style={{
                            left: dot.left,
                            top: dot.top,
                            width: `${dot.size}px`,
                            height: `${dot.size}px`,
                            opacity: 0.3,
                            animation: `floatDot ${dot.duration}s ease-in-out ${dot.delay}s infinite`,
                        }}
                    />
                ))}
            </div>
            
            <div className="pointer-events-none absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
                <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-indigo-100 to-white opacity-40 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{clipPath: "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)"}}></div>
            </div>

            <div className="relative z-10 mx-auto max-w-md">
                <div className="mb-12 mt-4 flex flex-col items-center">
                    <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 25, ease: "linear", repeat: Number.POSITIVE_INFINITY }}
                        className="pointer-events-none absolute -z-10 mt-2 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.08),transparent_70%)] blur-2xl"
                    />

                    <div className="relative mb-8 flex h-16 w-16 items-center justify-center rounded-[20px] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100">
                        <MapPin className="h-7 w-7 text-indigo-600" />
                        <Cross className="absolute h-4 w-4 text-indigo-300" />
                    </div>

                    <h1 className="text-center font-sans text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl">
                        Arogya AI
                    </h1>
                    <p className="mt-4 text-center text-sm font-semibold tracking-wide text-slate-500 uppercase">ಆರೋಗ್ಯ AI · आरोग्य AI</p>
                    <p className="mt-2 text-center text-[15px] font-medium text-slate-400">{STRINGS.english.yourHealthYourLanguage}</p>
                </div>

                <div className="space-y-4">
                    {active.map((languageCard) => {
                        const isSelected = selected === languageCard.key;
                        return (
                            <motion.button
                                key={languageCard.key}
                                whileHover={{ scale: 1.01, y: -2 }}
                                whileTap={{ scale: 0.99 }}
                                animate={isSelected ? { scale: 1.01, y: -2 } : { scale: 1, y: 0 }}
                                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                onClick={() => selectLanguage(languageCard.key)}
                                className={`group relative min-h-[72px] w-full overflow-hidden rounded-2xl border bg-white px-6 py-4 text-left shadow-sm transition-all duration-300 ${
                                    isSelected
                                        ? "border-indigo-600 ring-1 ring-indigo-600 ring-offset-2 shadow-[0_10px_30px_rgba(99,102,241,0.15)]"
                                        : "border-slate-200 hover:border-indigo-300 hover:shadow-md"
                                }`}
                            >
                                <div className="relative z-10 flex items-center justify-between">
                                    <div>
                                        <p className={`text-xl font-bold tracking-tight transition-colors ${isSelected ? "text-indigo-900" : "text-slate-800"}`}>{languageCard.script}</p>
                                        <p className="mt-1 text-sm font-medium text-slate-500 group-hover:text-slate-600 transition-colors">{languageCard.name}</p>
                                    </div>
                                    {isSelected && (
                                        <motion.div
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 shadow-[0_4px_12px_rgba(99,102,241,0.3)]"
                                        >
                                            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </motion.div>
                                    )}
                                </div>
                                {isSelected && (
                                    <motion.div
                                        layoutId="glow"
                                        className="absolute inset-0 z-0 bg-indigo-50/50"
                                    />
                                )}
                            </motion.button>
                        );
                    })}
                </div>

                <div className="mt-10 flex flex-col items-center">
                    <div className="mb-6 flex items-center gap-4 w-full px-2">
                        <div className="h-px flex-1 bg-slate-200" />
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Coming Soon</span>
                        <div className="h-px flex-1 bg-slate-200" />
                    </div>
                    <div className="grid w-full grid-cols-3 gap-3">
                        {comingSoon.map((label, index) => (
                            <motion.button
                                key={label}
                                onClick={() => {
                                    setShakeIndex(index);
                                    setTimeout(() => setShakeIndex(null), 420);
                                }}
                                animate={shakeIndex === index ? { x: [-4, 4, -3, 3, 0] } : { x: 0 }}
                                transition={{ duration: 0.3 }}
                                className="flex h-11 items-center justify-center rounded-xl bg-slate-100/50 px-3 text-[13px] font-semibold text-slate-400 hover:bg-slate-100 hover:text-slate-500 transition-colors"
                            >
                                {label}
                            </motion.button>
                        ))}
                    </div>
                </div>
            </div>
        </motion.section>
    );
}
