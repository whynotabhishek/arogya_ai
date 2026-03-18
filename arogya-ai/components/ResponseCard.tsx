"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Volume2, MapPin, Navigation, Download, Phone } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { t } from "@/lib/translations";
import { vibrateSuccess } from "@/lib/haptics";

type Severity = "safe" | "caution" | "urgent" | "critical";

type Clinic = {
    name: string;
    district: string;
    timing: string;
    phone: string;
    lat?: number;
    lng?: number;
};

type ResponseCardProps = {
    open: boolean;
    text: string;
    severity: Severity;
    severityLabel: string;
    replayLabel: string;
    clinic?: Clinic;
    audioUrl?: string;
    onClose: () => void;
    onReplay: () => void;
    onSaveAudio?: () => void;
    onShareWhatsApp?: () => void;
};

const severityColor: Record<Severity, string> = {
    safe: "#00E5A0",
    caution: "#F59E0B",
    urgent: "#FF4444",
    critical: "#CC0000",
};

const severityBg: Record<Severity, string> = {
    safe: "rgba(0,229,160,0.06)",
    caution: "rgba(245,158,11,0.06)",
    urgent: "rgba(255,68,68,0.08)",
    critical: "rgba(204,0,0,0.1)",
};

export function ResponseCard({
    open,
    text,
    severity,
    severityLabel,
    replayLabel,
    clinic,
    audioUrl,
    onClose,
    onReplay,
    onSaveAudio,
    onShareWhatsApp,
}: ResponseCardProps) {
    const { language } = useLanguage();

    const handleDirections = () => {
        if (clinic?.lat && clinic?.lng) {
            const url = `https://maps.google.com/maps?q=${clinic.lat},${clinic.lng}&saddr=current+location`;
            window.open(url, "_blank");
        } else if (clinic?.name) {
            const url = `https://maps.google.com/maps?q=${encodeURIComponent(clinic.name + " " + clinic.district)}`;
            window.open(url, "_blank");
        }
    };

    const handleSaveAudio = () => {
        if (onSaveAudio) {
            onSaveAudio();
            return;
        }
        if (audioUrl) {
            const link = document.createElement("a");
            link.href = audioUrl.startsWith("http") ? audioUrl : `data:audio/mp3;base64,${audioUrl}`;
            link.download = `arogya-advice-${new Date().toDateString()}.mp3`;
            link.click();
            vibrateSuccess();
        }
    };

    if (!open) return null;

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="w-full max-w-[700px] mx-auto mt-4 mb-4"
                >
                    <div
                        className="relative rounded-[20px] border border-white/[0.08] overflow-hidden"
                        style={{ background: "rgba(13,21,37,0.95)" }}
                    >
                        {/* Top severity line */}
                        <div
                            className="absolute top-0 left-0 right-0 h-[2px]"
                            style={{ background: severityColor[severity] }}
                        />

                        <div className="px-5 pt-5 pb-4">
                            {/* Severity badge + replay */}
                            <div className="flex items-center justify-between gap-3 mb-3">
                                <div
                                    className="flex items-center gap-2 rounded-full border border-white/5 px-3 py-1.5 text-[12px] font-bold uppercase tracking-wider"
                                    style={{
                                        color: severityColor[severity],
                                        background: severityBg[severity],
                                    }}
                                >
                                    <span
                                        className="h-2 w-2 rounded-full animate-pulse"
                                        style={{
                                            backgroundColor: severityColor[severity],
                                            boxShadow: `0 0 8px ${severityColor[severity]}`,
                                        }}
                                    />
                                    {severityLabel}
                                </div>
                                <button
                                    onClick={onReplay}
                                    className="group flex h-9 items-center justify-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 text-xs font-semibold text-purple-100 transition-all hover:border-purple-400/50 hover:bg-purple-500/20 active:scale-95"
                                >
                                    <Volume2 className="h-3.5 w-3.5 text-purple-300 transition-transform group-hover:scale-110" />
                                    {replayLabel}
                                </button>
                            </div>

                            {/* Response text — max 3 sentences, no scroll needed */}
                            <p className="text-[15px] font-medium leading-relaxed text-slate-200 whitespace-pre-line">
                                {text}
                            </p>

                            {/* Clinic info */}
                            {clinic && (
                                <div className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#00E5A0]/10">
                                            <MapPin className="h-3.5 w-3.5 text-[#00E5A0]" />
                                        </div>
                                        <span className="text-sm font-bold text-white tracking-tight">{clinic.name}</span>
                                    </div>
                                    <div className="space-y-1 pl-9 mb-3">
                                        <p className="text-xs font-medium text-slate-400">{clinic.district}</p>
                                        <p className="text-xs font-medium text-slate-400">{clinic.timing}</p>
                                        <p className="text-xs font-medium text-slate-400">{clinic.phone}</p>
                                    </div>
                                    <button
                                        onClick={handleDirections}
                                        className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all active:scale-95"
                                        style={{
                                            background: "rgba(0,229,160,0.1)",
                                            border: "1px solid rgba(0,229,160,0.3)",
                                            color: "#00E5A0",
                                        }}
                                    >
                                        <Navigation className="h-3.5 w-3.5" />
                                        {t("directions", language)}
                                    </button>
                                </div>
                            )}

                            {/* 108 Emergency button for urgent */}
                            {(severity === "urgent" || severity === "critical") && (
                                <a
                                    href="tel:108"
                                    className="flex items-center justify-center gap-2 w-full mt-4 h-14 rounded-2xl text-white font-bold text-base animate-pulse"
                                    style={{
                                        background: "linear-gradient(135deg, #FF4444, #CC0000)",
                                    }}
                                >
                                    <Phone className="h-5 w-5" />
                                    {t("call108", language)}
                                </a>
                            )}

                            {/* Bottom actions: save audio left, share whatsapp right */}
                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.06]">
                                <button
                                    onClick={handleSaveAudio}
                                    className="flex items-center gap-2 text-xs font-medium text-white/50 hover:text-white/90 transition-colors active:scale-95"
                                >
                                    <Download className="h-3.5 w-3.5" />
                                    💾 {t("saveAudio", language)}
                                </button>
                                <button
                                    onClick={onShareWhatsApp}
                                    className="flex items-center gap-2 text-xs font-medium transition-colors active:scale-95"
                                    style={{ color: "#25D366" }}
                                >
                                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766 0 1.011.266 1.996.772 2.87l-.824 3.003 3.078-.809a5.728 5.728 0 002.742.695h.001c3.181 0 5.768-2.586 5.768-5.766 0-3.181-2.587-5.767-5.769-5.767zm3.178 8.019c-.174.492-.93.931-1.311.97-.348.035-.8.113-2.315-.515-1.831-.762-3.008-2.637-3.098-2.757-.09-.12-.738-.985-.738-1.879s.467-1.348.63-1.53c.163-.182.353-.228.473-.228.12 0 .24.001.345.006.111.005.26-.041.4.298.15.362.51.1246.56.1368.045.12.045.285-.09.435-.135.15-.27.315-.39.42-.135.12-.275.255-.135.495.14.24.625 1.031 1.345 1.676.929.831 1.705 1.091 1.945 1.211.24.12.38.09.52-.075.14-.165.61-.72.77-.975.16-.255.32-.21.545-.12.23.09 1.43.675 1.67.795.24.12.4.18.46.285.06.105.06.615-.114 1.107z" />
                                    </svg>
                                    {t("shareWhatsApp", language)}
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
