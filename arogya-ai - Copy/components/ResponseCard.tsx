"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Volume2, MapPin } from "lucide-react";

type Severity = "safe" | "caution" | "urgent" | "critical";

type Clinic = {
    name: string;
    district: string;
    timing: string;
    phone: string;
};

type ResponseCardProps = {
    open: boolean;
    text: string;
    severity: Severity;
    severityLabel: string;
    replayLabel: string;
    clinic?: Clinic;
    onClose: () => void;
    onReplay: () => void;
};

const severityColor: Record<Severity, string> = {
    safe: "#10b981", // emerald-500
    caution: "#f59e0b", // amber-500
    urgent: "#f43f5e", // rose-500
    critical: "#dc2626", // red-600
};

const severityLine: Record<Severity, string> = {
    safe: "linear-gradient(90deg, transparent, #34d399, transparent)",
    caution: "linear-gradient(90deg, transparent, #fbbf24, transparent)",
    urgent: "linear-gradient(90deg, transparent, #fb7185, transparent)",
    critical: "linear-gradient(90deg, transparent, #f87171, transparent)",
};

export function ResponseCard({
    open,
    text,
    severity,
    severityLabel,
    replayLabel,
    clinic,
    onClose,
    onReplay,
}: ResponseCardProps) {

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.button
                        aria-label="dismiss"
                        onClick={onClose}
                        className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />

                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", stiffness: 220, damping: 24 }}
                        className="fixed inset-x-0 bottom-0 z-50 rounded-t-[32px] border border-white/10 bg-slate-900/95 px-6 pb-10 pt-6 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl"
                    >
                        <div className="absolute inset-x-0 top-0 h-1 opacity-80" style={{ background: severityLine[severity] }} />
                        <div className="mx-auto mb-6 h-1.5 w-16 rounded-full bg-slate-700/80" />

                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 rounded-full border border-white/5 bg-slate-800/80 px-3 py-1.5 text-[13px] font-bold uppercase tracking-wider" style={{ color: severityColor[severity] }}>
                                <span className="h-2 w-2 rounded-full animate-pulse shadow-sm" style={{ backgroundColor: severityColor[severity], boxShadow: `0 0 8px ${severityColor[severity]}` }} />
                                {severityLabel}
                            </div>
                            <button
                                onClick={onReplay}
                                className="group flex h-10 items-center justify-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 text-sm font-semibold text-purple-100 transition-all hover:border-purple-400/50 hover:bg-purple-500/20 active:scale-95"
                            >
                                <Volume2 className="h-4 w-4 text-purple-300 transition-transform group-hover:scale-110" />
                                {replayLabel}
                            </button>
                        </div>

                        <p className="text-[15px] font-medium leading-relaxed text-slate-200">{text}</p>

                        {clinic && (
                            <div className="mt-6 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5 shadow-inner backdrop-blur-md">
                                <div className="mb-3 flex items-center gap-2 text-rose-100">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/20">
                                        <MapPin className="h-4 w-4 text-rose-400" />
                                    </div>
                                    <span className="text-lg font-bold tracking-tight">{clinic.name}</span>
                                </div>
                                <div className="space-y-1.5 pl-10">
                                    <p className="text-sm font-medium text-slate-400">{clinic.district}</p>
                                    <p className="text-sm font-medium text-slate-400">{clinic.timing}</p>
                                    <p className="text-sm font-medium text-slate-400">{clinic.phone}</p>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
