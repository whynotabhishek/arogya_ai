"use client";

import { ArogyaChat } from "@/components/ui/arogya-chat";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { t } from "@/lib/translations";

export default function Home() {
    const router = useRouter();
    const { language } = useLanguage();

    return (
        <ArogyaChat
            title={t("heroTitle", language)}
            subtitle={t("heroSubtitle", language)}
            announcementText={t("badgeText", language)}
            placeholder={t("placeholder", language)}
            heroHighlight={t("heroHighlight", language)}
            heroEnding={t("heroEnding", language)}
            onSend={(message) => {
                localStorage.setItem("arogya_initial_query", message);
                router.push("/assistant");
            }}
        />
    );
}
