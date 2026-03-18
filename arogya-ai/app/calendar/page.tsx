"use client";

import { useLanguage } from "@/context/LanguageContext";
import { t, type Language } from "@/lib/translations";
import { SymptomCalendar } from "@/components/SymptomCalendar";

export default function CalendarPage() {
    const { language } = useLanguage();

    return (
        <div style={{ background: "#060A14", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <div
                style={{
                    padding: "24px 20px 8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    maxWidth: "1400px",
                    margin: "0 auto",
                    width: "100%",
                    paddingTop: "32px",
                }}
            >
                <div>
                    <div style={{ fontFamily: "Syne", fontSize: "28px", fontWeight: "800", color: "white" }}>
                        {t("calendarTitle", language as Language)}
                    </div>
                    <div style={{ fontSize: "15px", color: "rgba(255,255,255,0.4)", marginTop: "4px" }}>
                        Symptom History
                    </div>
                </div>
                <a
                    href="/assistant"
                    style={{
                        background: "rgba(255,140,0,0.1)",
                        border: "1px solid rgba(255,140,0,0.3)",
                        color: "#FF8C00",
                        borderRadius: "20px",
                        padding: "8px 16px",
                        fontSize: "13px",
                        textDecoration: "none",
                        transition: "all 0.2s ease",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontWeight: 600,
                    }}
                >
                    &larr; Back
                </a>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
                <SymptomCalendar language={language as Language} />
            </div>
        </div>
    );
}
