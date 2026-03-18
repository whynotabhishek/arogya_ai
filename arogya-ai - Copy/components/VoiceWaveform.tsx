"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type VoiceWaveformProps = {
    isListening: boolean;
    stream: MediaStream | null;
    isProcessing: boolean;
};

export function VoiceWaveform({ isListening, stream, isProcessing }: VoiceWaveformProps) {
    const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array(20));
    const animationRef = useRef<number>();
    const analyserRef = useRef<AnalyserNode | null>(null);

    useEffect(() => {
        if (!isListening || !stream) {
            cancelAnimationFrame(animationRef.current!);
            return;
        }

        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            const audioCtx = new AudioContext();
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 64; // Small size for just 20 bars
            
            const source = audioCtx.createMediaStreamSource(stream);
            source.connect(analyser);
            analyserRef.current = analyser;

            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            const renderFrame = () => {
                analyser.getByteFrequencyData(dataArray);
                // take first 20 bins
                setAudioData(new Uint8Array(dataArray.slice(0, 20)));
                animationRef.current = requestAnimationFrame(renderFrame);
            };

            renderFrame();

            return () => {
                cancelAnimationFrame(animationRef.current!);
                source.disconnect();
                analyser.disconnect();
                audioCtx.close();
            };
        } catch (e) {
            console.error("Audio Web API not supported", e);
        }
    }, [isListening, stream]);

    if (!isListening && !isProcessing) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 48 }}
                exit={{ opacity: 0, height: 0 }}
                className="mx-auto flex w-[200px] h-12 items-end justify-center gap-1 overflow-hidden pointer-events-none mt-2"
            >
                {Array.from({ length: 20 }).map((_, i) => {
                    const val = isListening && !isProcessing ? audioData[i] || 0 : 0;
                    
                    // Base 4px height when idle/listening. 
                    // Map frequency [0-255] to max 40px height visually.
                    let height = 4 + (val / 255) * 36;
                    
                    if (isProcessing) {
                        height = 12; // Base height for wave animation when processing
                    }
                    
                    return (
                        <motion.div
                            key={i}
                            animate={
                                isProcessing 
                                ? { height: [4, 24, 4] } 
                                : { height: height, opacity: val > 0 ? 0.9 : 0.3 }
                            }
                            transition={
                                isProcessing 
                                ? { duration: 1.2, repeat: Infinity, delay: i * 0.05, ease: "easeInOut" }
                                : { type: "tween", ease: "linear", duration: 0.1 }
                            }
                            className="w-[3px] rounded-t bg-emerald-500 dark:bg-[#00E5A0]"
                        />
                    );
                })}
            </motion.div>
        </AnimatePresence>
    );
}
