"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { savePatientProfile, type PatientProfile } from "@/lib/patient-profile";
import type { SupportedLanguage } from "@/prompts/health";

export function ProfileSetup({
    language,
    initialProfile,
    initialAvatar,
    onProfileSaved,
    onComplete,
}: {
    language: SupportedLanguage;
    initialProfile?: PatientProfile | null;
    initialAvatar?: string | null;
    onProfileSaved?: (profile: PatientProfile, avatar?: string | null) => void;
    onComplete: () => void;
}) {
    const [name, setName] = useState(initialProfile?.name ?? "");
    const [age, setAge] = useState(initialProfile?.age ? String(initialProfile.age) : "");
    const [conditions, setConditions] = useState<string[]>(initialProfile?.chronicConditions ?? []);
    const [contact, setContact] = useState(initialProfile?.emergencyContact ?? "");
    const [bloodGroup, setBloodGroup] = useState(initialProfile?.bloodGroup ?? "");
    const [avatar, setAvatar] = useState<string | null>(initialAvatar ?? null);

    const toggleCondition = (cond: string) => {
        if (cond === "None") {
            setConditions(["None"]);
            return;
        }
        setConditions(prev => {
            const filtered = prev.filter(c => c !== "None");
            if (filtered.includes(cond)) return filtered.filter(c => c !== cond);
            return [...filtered, cond];
        });
    };

    const handleSave = () => {
        if (!name || !age) {
            // Simplified validation for UX
        }

        const profile: PatientProfile = {
            name: name || "Guest",
            age: parseInt(age) || 0,
            language,
            chronicConditions: conditions.length ? conditions : ["None"],
            emergencyContact: contact,
            bloodGroup,
            createdAt: initialProfile?.createdAt ?? new Date().toISOString()
        };
        savePatientProfile(profile);
        if (avatar) {
            localStorage.setItem("arogya-user-avatar", avatar);
        }
        onProfileSaved?.(profile, avatar);
        onComplete();
    };

    const onPhotoSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const fileReader = new FileReader();
        fileReader.onload = () => {
            const result = fileReader.result;
            if (typeof result === "string") {
                setAvatar(result);
            }
        };
        fileReader.readAsDataURL(file);

        event.target.value = "";
    };

    const conditionList = ["Diabetes", "Blood Pressure", "Heart Disease", "Asthma", "Kidney Disease", "None"];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
        >
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold text-slate-800 mb-6 font-sans">Patient Profile</h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-600 mb-2">Photo</label>
                        <div className="flex items-center gap-4">
                            {avatar ? (
                                <img src={avatar} alt="Profile" className="h-16 w-16 rounded-full object-cover border-2 border-slate-200" />
                            ) : (
                                <div className="h-16 w-16 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-400 font-semibold">
                                    No Photo
                                </div>
                            )}
                            <label className="cursor-pointer rounded-xl border-2 border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300 transition-colors">
                                Upload Photo
                                <input type="file" accept="image/*" className="hidden" onChange={onPhotoSelected} />
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-600 mb-2">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded-xl border-2 border-slate-200 p-4 text-lg font-medium text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
                            placeholder="Your Name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-600 mb-2">Age</label>
                        <input
                            type="number"
                            inputMode="numeric"
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            className="w-full rounded-xl border-2 border-slate-200 p-4 text-lg font-medium text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
                            placeholder="Your Age"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-600 mb-2">Pre-existing Conditions</label>
                        <div className="flex flex-wrap gap-2">
                            {conditionList.map((cond) => {
                                const active = conditions.includes(cond);
                                return (
                                    <button
                                        key={cond}
                                        onClick={() => toggleCondition(cond)}
                                        className={`rounded-full border-2 px-4 py-2 text-sm font-bold transition-all ${active
                                                ? "border-indigo-600 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                                                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                                            }`}
                                    >
                                        {active ? "✓ " : "□ "}{cond}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-600 mb-2">Emergency Phone</label>
                        <input
                            type="tel"
                            value={contact}
                            onChange={(e) => setContact(e.target.value)}
                            className="w-full rounded-xl border-2 border-slate-200 p-4 text-lg font-medium text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
                            placeholder="10-digit mobile number"
                        />
                    </div>
                </div>

                <div className="mt-8 flex flex-col gap-3">
                    <button
                        onClick={handleSave}
                        className="w-full rounded-2xl bg-[#FF8C00] p-4 text-lg font-bold text-white shadow-[0_4px_15px_rgba(255,140,0,0.3)] transition-colors hover:bg-[#E07A00]"
                    >
                        {initialProfile ? "Update Profile" : "Save Profile"}
                    </button>
                    <button
                        onClick={onComplete}
                        className="w-full rounded-xl p-3 text-sm font-semibold text-slate-400 hover:text-slate-600"
                    >
                        Set up later
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
