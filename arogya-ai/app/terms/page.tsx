import { FileText } from "lucide-react";

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-[#060A14] flex justify-center text-slate-200 p-6 md:p-12 font-sans relative overflow-hidden">
             {/* Radial Glow Background */}
             <div className="pointer-events-none absolute inset-0 z-0 flex justify-center items-center overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#FF8C00] opacity-[0.05] blur-[120px] rounded-full" />
            </div>

            <div className="relative z-10 max-w-3xl w-full bg-[#0B1021] border border-slate-800 p-8 md:p-12 rounded-3xl mt-10 shadow-2xl h-fit flex flex-col items-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 shadow-[0_0_20px_rgba(99,102,241,0.1)] mb-6 border border-indigo-500/30">
                    <FileText className="h-8 w-8 text-indigo-400" />
                </div>

                <h1 className="text-3xl font-extrabold text-white mb-2 font-heading text-center">Terms of Service — Arogya AI</h1>
                <p className="text-slate-500 mb-8 font-medium">Last updated: March 2025</p>

                <div className="space-y-8 text-slate-400 font-medium text-left w-full">
                    <section>
                        <h2 className="text-xl text-white font-bold mb-3">1. ACCEPTANCE OF TERMS</h2>
                        <p className="leading-relaxed">
                            By using Arogya AI, you agree to these terms. If you disagree, do not use this service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl text-white font-bold mb-3">2. WHAT AROGYA AI IS</h2>
                        <p className="leading-relaxed">
                            Arogya AI is an AI-powered informational health assistant. It is NOT a medical service, hospital, clinic, or licensed healthcare provider.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl text-white font-bold mb-3">3. WHAT AROGYA AI IS NOT</h2>
                        <ul className="list-disc pl-5 space-y-2 leading-relaxed">
                            <li>Not a replacement for a real doctor</li>
                            <li>Not an emergency service</li>
                            <li>Not a diagnostic tool</li>
                            <li>Not a prescription service</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl text-white font-bold mb-3">4. YOUR RESPONSIBILITIES</h2>
                        <ul className="list-disc pl-5 space-y-2 leading-relaxed">
                            <li>You must be 18+ or have guardian consent</li>
                            <li>You must not rely solely on AI responses for medical decisions</li>
                            <li>You must call 108 in any life-threatening emergency</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl text-white font-bold mb-3">5. LIMITATIONS OF LIABILITY</h2>
                        <p className="leading-relaxed">
                            Arogya AI and its developers are not liable for any health decisions made based on AI responses. Always consult a certified doctor at your nearest Primary Health Centre (PHC).
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl text-white font-bold mb-3">6. DATA & PRIVACY</h2>
                        <p className="leading-relaxed">
                            We do not sell your data. Voice inputs are processed in real-time and not stored permanently. See our Privacy Policy for full details.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl text-white font-bold mb-3">7. CHANGES TO TERMS</h2>
                        <p className="leading-relaxed">
                            We may update these terms at any time. Continued use means acceptance.
                        </p>
                    </section>
                </div>

                <div className="mt-12 w-full pt-8 border-t border-slate-800 text-center text-slate-500">
                    Contact: <a href="mailto:support@arogyaai.in" className="text-indigo-400 hover:text-indigo-300">support@arogyaai.in</a>
                </div>
            </div>
        </div>
    );
}
