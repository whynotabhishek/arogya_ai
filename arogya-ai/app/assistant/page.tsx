"use client";

import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { MainScreen } from "@/components/MainScreen";
import { useLanguage } from "@/context/LanguageContext";

export default function App() {
    const { language, setLanguage } = useLanguage();

    useEffect(() => {
        // If no valid language stored, redirect to home for language selection
        const stored = localStorage.getItem("arogya_language");
        if (!stored || !["kannada", "hindi", "english", "telugu"].includes(stored)) {
            window.location.href = "/";
        }
    }, []);

    return (
        <AnimatePresence mode="wait">
            {language ? (
                <MainScreen
                    key="main"
                    language={language}
                    onLanguageSwitch={() => {
                        window.location.href = "/";
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
