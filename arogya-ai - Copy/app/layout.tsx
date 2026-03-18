import type { Metadata, Viewport } from "next";
import { DM_Sans, Noto_Sans_Kannada, Syne } from "next/font/google";
import Link from "next/link";
import { Activity } from "lucide-react";
import "./globals.css";
import { Providers } from "@/components/Providers";

const syne = Syne({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["800"],
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const notoKannada = Noto_Sans_Kannada({
  variable: "--font-kannada",
  subsets: ["kannada"],
  weight: ["400", "500", "700"],
});

export const viewport: Viewport = {
  themeColor: "#FF8C00",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "Arogya AI | ಆರೋಗ್ಯ AI",
  description: "Voice-first multilingual health assistant for rural India",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Arogya AI",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            try {
              if (localStorage.getItem('arogya_theme') === 'light') {
                document.documentElement.classList.remove('dark');
              } else {
                document.documentElement.classList.add('dark');
              }
            } catch (e) {}
          `
        }} />
      </head>
      <body className={`${syne.variable} ${dmSans.variable} ${notoKannada.variable} antialiased min-h-screen flex flex-col bg-slate-50 dark:bg-[#060A14] text-slate-900 dark:text-white transition-colors duration-300`}>
        <Providers>
          <div className="flex-1">
            {children}
          </div>
          <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#060A14] py-8 px-6 mt-auto shrink-0 z-50 relative transition-colors duration-300">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-[#FF8C00]" />
              <div>
                <span className="font-heading font-bold text-slate-800 dark:text-white tracking-wide">Arogya AI</span>
              </div>
            </div>
            
            <div className="flex items-center gap-6 text-sm font-medium text-slate-400">
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <span>&middot;</span>
              <Link href="/disclaimer" className="hover:text-white transition-colors">Disclaimer</Link>
              <span>&middot;</span>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            </div>

            <div className="text-center md:text-right text-sm">
                <p className="text-[#00E5A0] font-semibold mb-1 tracking-wide">Built for rural India with care</p>
                <p className="text-slate-600 font-medium">&copy; 2025 Arogya AI. Not a medical service.</p>
            </div>
          </div>
        </footer>
        </Providers>
      </body>
    </html>
  );
}
