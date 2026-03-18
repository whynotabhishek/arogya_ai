import { useState, useRef, useCallback } from 'react';

export type RecordingState = "idle" | "recording" | "processing" | "cancelled";

interface UseVoiceRecorderReturn {
  recordingState: RecordingState;
  recordingTime: number;
  audioLevel: number;
  startRecording: () => void;
  stopRecording: () => void;
  cancelRecording: () => void;
}

export function useVoiceRecorder(
  language: string,
  onAudioProcessed: (response: any) => void,
  onError: (error: string) => void,
  getPayload?: () => Record<string, any>
): UseVoiceRecorderReturn {
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const maxTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isCancelledRef = useRef<boolean>(false);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (maxTimerRef.current) clearTimeout(maxTimerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }
  }, []);

  const updateAudioLevel = useCallback(() => {
    if (analyserRef.current) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      setAudioLevel(Math.min(1, average / 64)); // Normalize to roughly 0-1
    }
    if (!isCancelledRef.current) {
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      cleanup();
      isCancelledRef.current = false;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && !isCancelledRef.current) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        
        if (isCancelledRef.current) {
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64AudioMessage = reader.result as string;
          const base64Data = base64AudioMessage.split(',')[1] || base64AudioMessage;
          
          try {
            const res = await fetch('/api/voice', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                audio: base64Data,
                language,
                ...(getPayload ? getPayload() : {})
              })
            });
            
            if (!res.ok) {
              const errData = await res.json().catch(() => ({}));
              throw new Error(errData.error || "Voice processing failed");
            }
            
            const data = await res.json();
            onAudioProcessed(data);
          } catch (err: any) {
            onError(err.message || "An error occurred");
          } finally {
            if (!isCancelledRef.current) {
               setRecordingState("idle");
            }
          }
        };
      };

      mediaRecorder.start();
      setRecordingState("recording");
      setRecordingTime(0);
      setAudioLevel(0);
      
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50);
      }

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      maxTimerRef.current = setTimeout(() => {
        stopRecording();
      }, 60000);

      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    } catch (err) {
      console.error("Failed to start recording:", err);
      setRecordingState("idle");
    }
  }, [cleanup, language, onAudioProcessed, onError, updateAudioLevel, getPayload]);

  const stopRecording = useCallback(() => {
    if (isCancelledRef.current || recordingState !== "recording") return;
    
    setRecordingState("processing");
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(100);
    }
    
    if (timerRef.current) clearInterval(timerRef.current);
    if (maxTimerRef.current) clearTimeout(maxTimerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
  }, [recordingState]);

  const cancelRecording = useCallback(() => {
    if (recordingState !== "recording") return;

    isCancelledRef.current = true;
    setRecordingState("cancelled");
    
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([50, 50]);
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }

    cleanup();
    audioChunksRef.current = [];
    
    setTimeout(() => {
      setRecordingState(current => current === "cancelled" ? "idle" : current);
    }, 800);
  }, [recordingState, cleanup]);

  return {
    recordingState,
    recordingTime,
    audioLevel,
    startRecording,
    stopRecording,
    cancelRecording
  };
}
