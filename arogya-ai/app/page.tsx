"use client";

import { AnimatePresence } from "framer-motion";
import { MainScreen } from "@/components/MainScreen";
import { useLanguage } from "@/context/LanguageContext";

export default function Home() {
    const { language } = useLanguage();

    return (
        <AnimatePresence mode="wait">
            {language ? (
                <MainScreen
                    key="main"
                    language={language}
                    onLanguageSwitch={() => {
                        // The language switch is handled dynamically via the ModelSelector Dropdown now
                    }}
                />
            ) : (
                <div className="min-h-screen bg-[#060A14] flex items-center justify-center">
                    {/* Loading empty state while Language loads */}
                </div>
            )}
        </AnimatePresence>
    );
}
