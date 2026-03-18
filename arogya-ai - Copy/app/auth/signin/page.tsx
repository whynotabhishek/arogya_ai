import { signIn } from "@/auth";
import { Activity } from "lucide-react";

export default function SignInPage() {
    return (
        <div className="min-h-screen flex flex-col justify-center items-center p-6 text-slate-200 font-sans relative overflow-hidden">
            {/* Minimal Background Glow */}
            <div className="pointer-events-none absolute inset-0 z-0 flex justify-center items-center">
                <div className="w-[400px] h-[400px] bg-[#FF8C00]/10 blur-[100px] rounded-full" />
            </div>

            <div className="relative z-10 w-full max-w-[400px] bg-[#0B1021] border border-slate-800 flex flex-col items-center text-center p-8 rounded-3xl shadow-2xl">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF8C00] to-[#E67E00] shadow-[0_0_20px_rgba(255,140,0,0.3)] mb-4">
                    <Activity className="h-6 w-6 text-white" />
                </div>
                
                <h1 className="text-2xl font-bold text-white mb-2 font-heading tracking-tight">Arogya AI</h1>
                
                <h2 className="text-lg font-bold text-[#FF8C00] mb-3 font-heading uppercase tracking-wide">
                    Caretaker / ASHA Worker Portal
                </h2>
                
                <p className="text-sm text-slate-400 mb-10 leading-relaxed font-medium">
                    Set up Arogya AI for your family members or village patients. Manage their medical history and emergency contacts.
                </p>

                <form
                    action={async () => {
                        "use server"
                        await signIn("google")
                    }}
                    className="w-full"
                >
                    <button
                        type="submit"
                        className="w-full h-12 bg-white flex items-center justify-center gap-3 rounded-full text-slate-900 font-bold hover:bg-slate-100 transition-colors shadow-md"
                    >
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                            <path d="M1 1h22v22H1z" fill="none" />
                        </svg>
                        Continue with Google
                    </button>
                </form>

                <p className="mt-6 text-[12px] text-slate-500 max-w-[250px]">
                    Your data is private and never sold.
                </p>
            </div>
        </div>
    );
}
