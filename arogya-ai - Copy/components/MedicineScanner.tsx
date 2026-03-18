"use client";

import { motion } from "framer-motion";
import { Pill } from "lucide-react";

type MedicineScannerProps = {
    label: string;
    sublabel: string;
    onPickImage: () => void;
};

export function MedicineScanner({ label, sublabel, onPickImage }: MedicineScannerProps) {
    return (
        <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onPickImage}
            className="group relative flex min-h-12 w-full items-center justify-start gap-3 rounded-[18px] border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-800/60 px-4 py-3 text-left transition-all duration-300 hover:border-purple-300 dark:hover:border-purple-500/40 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:shadow-[0_0_20px_rgba(168,85,247,0.1)] dark:hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] shadow-sm dark:shadow-none backdrop-blur-md"
        >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:bg-purple-200 dark:group-hover:bg-purple-500/20 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                <Pill className="h-5 w-5" />
            </div>
            <div className="leading-tight">
                <p className="text-sm font-semibold tracking-wide text-slate-800 dark:text-white">{label}</p>
                <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">{sublabel}</p>
            </div>
        </motion.button>
    );
}
