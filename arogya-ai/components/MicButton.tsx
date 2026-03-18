import React, { useRef, useEffect } from 'react';
import { Mic, Loader2 } from 'lucide-react';
import { useVoiceRecorder, RecordingState } from '@/hooks/useVoiceRecorder';
import { DM_Sans } from 'next/font/google';
import { t, type Language } from '@/lib/translations';

const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400', '500'] });

interface MicButtonProps {
  language: string;
  onAudioProcessed: (response: any) => void;
  onError?: (error: string) => void;
  onStateChange?: (state: RecordingState, time: number, level: number) => void;
  getPayload?: () => Record<string, any>;
}

export function MicButton({ language, onAudioProcessed, onError = () => {}, onStateChange, getPayload }: MicButtonProps) {
  const {
    recordingState,
    recordingTime,
    audioLevel,
    startRecording,
    stopRecording,
    cancelRecording
  } = useVoiceRecorder(language, onAudioProcessed, onError, getPayload);

  useEffect(() => {
    onStateChange?.(recordingState, recordingTime, audioLevel);
  }, [recordingState, recordingTime, audioLevel, onStateChange]);

  useEffect(() => {
    const handleCancelEvent = () => cancelRecording();
    window.addEventListener('cancel-microphone-recording', handleCancelEvent);
    return () => window.removeEventListener('cancel-microphone-recording', handleCancelEvent);
  }, [cancelRecording]);

  const handleClick = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    
    // Resume AudioContext on user gesture (fixes Safari autoplay)
    if (typeof window !== 'undefined' && (window as any).AudioContext) {
      try {
        const ctx = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
        if (ctx.state === 'suspended') ctx.resume();
        ctx.close();
      } catch { /* ignore */ }
    }

    if (recordingState === "idle") {
      startRecording();
    } else if (recordingState === "recording") {
      stopRecording();
    }
  };

  const lang = (['kannada', 'hindi', 'english', 'telugu'].includes(language) ? language : 'english') as Language;

  const isRecording = recordingState === "recording";
  const isCancelled = recordingState === "cancelled";
  const isProcessing = recordingState === "processing";
  const isIdle = recordingState === "idle";

  const buttonLabel = isRecording
    ? t('tapToSend', lang)
    : isCancelled
      ? t('cancelled', lang)
      : isProcessing
        ? t('sending', lang)
        : t('askButton', lang);

  return (
    <div className={`relative flex flex-col items-center justify-center ${dmSans.className}`}>
      <button
        type="button"
        className={`relative flex items-center justify-center gap-2 px-6 py-3 rounded-full text-white transition-all duration-200 select-none ${
          isRecording ? 'bg-[#FF4444] scale-110 shadow-[0_0_30px_rgba(255,68,68,0.6)]' :
          isCancelled ? 'bg-gray-500 scale-95 opacity-80' :
          isProcessing ? 'bg-gradient-to-br from-[#FF8C00] to-[#E85D00] scale-100 shadow-[0_0_20px_rgba(255,140,0,0.4)]' :
          'bg-gradient-to-br from-[#FF8C00] to-[#E85D00] scale-100 shadow-[0_0_15px_rgba(255,140,0,0.3)] hover:shadow-[0_0_20px_rgba(255,140,0,0.5)]'
        }`}
        onClick={handleClick}
        style={{ touchAction: 'none', WebkitUserSelect: 'none' } as React.CSSProperties}
      >
        {isRecording && (
           <div className="absolute inset-0 rounded-full animate-ping bg-[#FF4444]/40" />
        )}
        
        {isProcessing ? (
          <Loader2 className="size-5 animate-spin relative z-10" />
        ) : (
          <Mic className="size-5 relative z-10" />
        )}

        <span className="font-medium relative z-10 whitespace-nowrap">
          {buttonLabel}
        </span>
      </button>

      {/* Label below the button */}
      <div 
        className={`absolute top-full mt-2 text-[11px] text-[#a0a0a5] font-medium transition-opacity duration-200 whitespace-nowrap pointer-events-none ${
          isIdle ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {t('tapToSpeak', lang)}
      </div>
    </div>
  );
}
