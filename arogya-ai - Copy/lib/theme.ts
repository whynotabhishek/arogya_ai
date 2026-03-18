"use client";

import { useEffect, useState } from "react";

export type Theme = "dark" | "light";

export function getInitialTheme(): Theme {
    if (typeof window !== "undefined") {
        const stored = localStorage.getItem("arogya_theme");
        if (stored === "light" || stored === "dark") return stored;
    }
    return "dark"; // Default is dark per requirements
}

export function setThemeInStorage(theme: Theme) {
    if (typeof window !== "undefined") {
        localStorage.setItem("arogya_theme", theme);
        if (theme === "dark") {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }
}
