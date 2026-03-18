"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { getInitialTheme, setThemeInStorage, type Theme } from "@/lib/theme";

export function ThemeToggle() {
    const [theme, setTheme] = useState<Theme>("dark");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const init = getInitialTheme();
        setTheme(init);
        setThemeInStorage(init);
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="h-8 w-8" />; // placeholder to avoid hydration shift
    }

    const toggle = () => {
        const next = theme === "dark" ? "light" : "dark";
        setTheme(next);
        setThemeInStorage(next);
    };

    return (
        <button
            onClick={toggle}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-300 dark:hover:bg-slate-700"
            aria-label="Toggle theme"
        >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
    );
}
