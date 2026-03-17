"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import type { SupportedLanguage } from "@/prompts/health";
import { MainScreen } from "@/components/MainScreen";

export default function App() {
    const [language, setLanguage] = useState<SupportedLanguage | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem("arogya_language");
        if (stored === "kannada" || stored === "hindi" || stored === "english" || stored === "telugu") {
            setLanguage(stored);
        } else {
            // Force them back to the hero page if they have no language selected
            window.location.href = '/';
        }
    }, []);

    return (
        <AnimatePresence mode="wait">
            {language ? (
                <MainScreen
                    key="main"
                    language={language}
                    onLanguageSwitch={() => {
                        window.location.href = '/';
                    }}
                />
            ) : (
                <div className="min-h-screen bg-[#060A14] flex items-center justify-center">
                    {/* Loading empty state while it redirects */}
                </div>
            )}
        </AnimatePresence>
    );
}
