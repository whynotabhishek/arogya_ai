"use client";
import { motion } from "framer-motion";

export function TypingIndicator({ language }: { language: string }) {
    let text = "Thinking...";
    if (language === "kannada") text = "ಯೋಚಿಸುತ್ತಿದ್ದೇನೆ...";
    if (language === "hindi") text = "सोच रहा हूं...";
    if (language === "telugu") text = "ఆలోచిస్తోంది...";

    return (
        <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-start gap-1 p-4 mb-4"
        >
            <div className="flex items-center gap-1.5 rounded-[20px_20px_20px_4px] border border-slate-100 bg-slate-50 px-4 py-3 shadow-sm w-fit">
                <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ ease: "easeInOut", duration: 0.6, repeat: Infinity, delay: 0 }}
                    className="h-2 w-2 rounded-full bg-[#00E5A0]"
                />
                <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ ease: "easeInOut", duration: 0.6, repeat: Infinity, delay: 0.15 }}
                    className="h-2 w-2 rounded-full bg-[#00E5A0]"
                />
                <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ ease: "easeInOut", duration: 0.6, repeat: Infinity, delay: 0.3 }}
                    className="h-2 w-2 rounded-full bg-[#00E5A0]"
                />
            </div>
            <span className="text-[11px] font-medium text-slate-400 ml-2">{text}</span>
        </motion.div>
    );
}
