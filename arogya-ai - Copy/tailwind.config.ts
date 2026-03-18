import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: "class",
    content: [
        "./app/**/*.{ts,tsx}",
        "./components/**/*.{ts,tsx}",
        "./lib/**/*.{ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brandBg: "#060A14",
                brandPrimary: "#FF8C00",
                brandSecondary: "#00E5A0",
                brandAccent: "#7B35FF",
            },
            fontFamily: {
                sans: ["var(--font-body)", "sans-serif"],
                heading: ["var(--font-heading)", "sans-serif"],
                syne: ["var(--font-heading)", "sans-serif"],
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
};

export default config;
