import { Lock } from "lucide-react";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-[#060A14] flex justify-center text-slate-200 p-6 md:p-12 font-sans relative overflow-hidden">
             {/* Radial Glow Background */}
             <div className="pointer-events-none absolute inset-0 z-0 flex justify-center items-center overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#FF8C00] opacity-[0.05] blur-[120px] rounded-full" />
            </div>

            <div className="relative z-10 max-w-3xl w-full bg-[#0B1021] border border-slate-800 p-8 md:p-12 rounded-3xl mt-10 shadow-2xl h-fit flex flex-col items-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 shadow-[0_0_20px_rgba(0,229,160,0.1)] mb-6 border border-emerald-500/30">
                    <Lock className="h-8 w-8 text-emerald-400" />
                </div>
                
                <h1 className="text-3xl font-extrabold text-white mb-2 font-heading text-center">Privacy Policy — Arogya AI</h1>
                <p className="text-slate-500 mb-8 font-medium">Last updated: March 2025</p>
                
                <div className="space-y-8 text-slate-400 font-medium text-left w-full">
                    <section>
                        <h2 className="text-xl text-white font-bold mb-3">1. WHAT WE COLLECT</h2>
                        <ul className="list-disc pl-5 space-y-2 leading-relaxed">
                            <li>Voice input (processed in real-time, not stored)</li>
                            <li>Device language preference (stored locally)</li>
                            <li>Approximate location (only when you tap &quot;Find Clinic&quot;, never stored on our servers)</li>
                            <li>Google account info (name, email — only if you sign in via Caretaker Portal)</li>
                        </ul>
                    </section>
                    
                    <section>
                        <h2 className="text-xl text-white font-bold mb-3">2. WHAT WE DO NOT COLLECT</h2>
                        <ul className="list-disc pl-5 space-y-2 leading-relaxed">
                            <li>Your name (unless you sign in)</li>
                            <li>Your phone number</li>
                            <li>Your Aadhaar or health ID</li>
                            <li>Any sensitive personal health history</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl text-white font-bold mb-3">3. HOW WE USE YOUR DATA</h2>
                        <ul className="list-disc pl-5 space-y-2 leading-relaxed">
                            <li>Voice input &rarr; processed by Groq AI &rarr; discarded</li>
                            <li>Location &rarr; used only to find nearest PHC &rarr; discarded</li>
                            <li>Language preference &rarr; stored in your browser only</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl text-white font-bold mb-3">4. THIRD PARTY SERVICES</h2>
                        <p className="leading-relaxed mb-4">We use the following third-party services:</p>
                        <ul className="list-disc pl-5 space-y-2 leading-relaxed mb-4">
                            <li>Groq API — AI response generation</li>
                            <li>Murf AI — voice synthesis</li>
                            <li>Google OAuth — caretaker login only</li>
                            <li>Google Gemini — medicine image analysis</li>
                        </ul>
                        <p className="leading-relaxed">Each service has its own privacy policy.</p>
                    </section>

                    <section>
                        <h2 className="text-xl text-white font-bold mb-3">5. DATA SECURITY</h2>
                        <p className="leading-relaxed">
                            All API calls are made over HTTPS.<br/>
                            We do not maintain a user health database.<br/>
                            No voice recordings are stored.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl text-white font-bold mb-3">6. YOUR RIGHTS</h2>
                        <ul className="list-disc pl-5 space-y-2 leading-relaxed">
                            <li>You can clear your language preference anytime</li>
                            <li>You can sign out of the Caretaker Portal anytime</li>
                            <li>You can request data deletion: support@arogyaai.in</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl text-white font-bold mb-3">7. CHILDREN</h2>
                        <p className="leading-relaxed">
                            Arogya AI is not intended for users under 18 without guardian supervision.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl text-white font-bold mb-3">8. CONTACT</h2>
                        <p className="leading-relaxed">
                            For privacy concerns:<br/>
                            Email: <a href="mailto:support@arogyaai.in" className="text-emerald-400 hover:text-emerald-300">support@arogyaai.in</a>
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
