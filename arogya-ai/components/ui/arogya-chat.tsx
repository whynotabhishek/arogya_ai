'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Syne, DM_Sans } from 'next/font/google'
import { 
  Plus, Camera, MapPin, User, Heart, Mic, Languages, Pill,
  ChevronDown, Check, Send
} from 'lucide-react'
import { MicButton } from '../MicButton'
import { RecordingState } from '@/hooks/useVoiceRecorder'
import { useLanguage } from '@/context/LanguageContext'
import { t, type Language } from '@/lib/translations'

const syne = Syne({ subsets: ['latin'], weight: ['800'] })
const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400', '500'] })

// TYPES
interface Model {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  badge?: string
}

// MODEL SELECTOR
const models: Model[] = [
  { id: 'kannada', name: 'ಕನ್ನಡ', description: 'Kannada', icon: <Languages className="size-4 text-orange-400" />, badge: 'Default' },
  { id: 'hindi', name: 'हिंदी', description: 'Hindi', icon: <Languages className="size-4 text-green-400" /> },
  { id: 'english', name: 'English', description: 'English', icon: <Languages className="size-4 text-blue-400" /> },
  { id: 'telugu', name: 'తెలుగు', description: 'Telugu', icon: <Languages className="size-4 text-purple-400" /> },
]

export function ModelSelector({ selectedModel, onModelChange }: { 
  selectedModel?: string
  onModelChange?: (model: Model) => void 
}) {
  const { language, setLanguage } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const resolvedModel = selectedModel || language || 'kannada'
  const [selected, setSelected] = useState(models.find(m => m.id === resolvedModel) || models[0])

  // Keep in sync with language context
  useEffect(() => {
    const match = models.find(m => m.id === language)
    if (match && match.id !== selected.id) {
      setSelected(match)
    }
  }, [language, selected.id])

  const handleSelect = (model: Model) => {
    setSelected(model)
    setIsOpen(false)
    setLanguage(model.id as Language)
    onModelChange?.(model)
  }

  return (
    <div className={`relative ${dmSans.className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 text-[#8a8a8f] hover:text-white hover:bg-white/5 active:scale-95"
      >
        {selected.icon}
        <span>{selected.name}</span>
        <ChevronDown className={`size-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute bottom-full left-0 mb-2 z-50 min-w-[220px] bg-[#0D1525]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="p-1.5">
              <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#5a5a5f]">
                {t('selectLanguage', language)}
              </div>
              {models.map((model) => (
                <button
                  key={model.id}
                  onClick={() => handleSelect(model)}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-left transition-all duration-150 ${
                    selected.id === model.id ? 'bg-white/10 text-white' : 'text-[#a0a0a5] hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex-shrink-0">{model.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{model.name}</span>
                      {model.badge && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          model.badge === 'Default' ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'
                        }`}>
                          {model.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#6a6a6f]">{model.description}</span>
                  </div>
                  {selected.id === model.id && <Check className="size-4 text-orange-400 flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// CHAT INPUT
export function ChatInput({ value, onChange, onSend, isListening, onOptionClick, placeholder, getPayload, onVoiceResponse }: {
  value?: string
  onChange?: (val: string) => void
  onSend?: (message: string) => void
  isListening?: boolean
  onOptionClick?: (option: 'medicine' | 'clinic' | 'profile') => void
  placeholder?: string
  getPayload?: () => Record<string, any>
  onVoiceResponse?: (data: any) => void
}) {
  const { language } = useLanguage()
  const [internalMessage, setInternalMessage] = useState('')
  const message = value !== undefined ? value : internalMessage
  const setMessage = onChange || setInternalMessage
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0)

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  const renderWaveform = (level: number) => {
    return Array.from({ length: 12 }).map((_, i) => {
      const height = Math.max(4, 24 * level * (0.5 + Math.random() * 0.5));
      return (
        <span
          key={i}
          className="w-1 bg-[#00E5A0] rounded-full transition-all duration-75"
          style={{ height: `${height}px` }}
        />
      );
    });
  }

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }, [message])

  const handleSubmit = () => {
    onSend?.(message)
    if (message.trim()) {
      setMessage('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (message.trim()) {
         handleSubmit()
      }
    }
  }

  return (
    <div className={`relative w-full max-w-[680px] mx-auto ${dmSans.className}`}>
      <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-b from-white/[0.08] to-transparent pointer-events-none" />
      <div className="relative rounded-2xl bg-[rgba(13,21,37,0.95)] ring-1 ring-white/[0.08] shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_2px_20px_rgba(0,0,0,0.4)]">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || t('placeholder', language)}
            className="w-full resize-none bg-transparent text-[15px] text-white placeholder-[#5a5a5f] px-5 pt-5 pb-3 focus:outline-none min-h-[80px] max-h-[200px]"
            style={{ height: '80px' }}
          />
        </div>

        <div className="flex items-center justify-between px-3 pb-3 pt-1">
          <div className="flex items-center gap-1">
            <div className="relative">
              <button
                onClick={() => setShowAttachMenu(!showAttachMenu)}
                className="flex items-center justify-center size-8 rounded-full bg-white/[0.08] hover:bg-white/[0.12] text-[#8a8a8f] hover:text-white transition-all duration-200 active:scale-95"
              >
                <Plus className={`size-4 transition-transform duration-200 ${showAttachMenu ? 'rotate-45' : ''}`} />
              </button>

              {showAttachMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowAttachMenu(false)} />
                  <div className="absolute bottom-full left-0 mb-2 z-50 bg-[#0D1525]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="p-1.5 min-w-[180px]">
                      {[
                        { id: 'medicine' as const, icon: <Camera className="size-4" />, label: t('scanMedicine', language) },
                        { id: 'clinic' as const, icon: <MapPin className="size-4" />, label: t('nearestClinic', language) },
                        { id: 'profile' as const, icon: <User className="size-4" />, label: t('myHealthProfile', language) }
                      ].map((item, i) => (
                        <button key={i} onClick={() => { onOptionClick?.(item.id); setShowAttachMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[#a0a0a5] hover:bg-white/5 hover:text-white transition-all duration-150">
                          {item.icon}
                          <span className="text-sm">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            <ModelSelector />
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium text-[#6a6a6f] hover:text-white hover:bg-white/5 transition-all duration-200">
              <Heart className="size-4" />
              <span className="hidden sm:inline">{t('history', language)}</span>
            </button>

            {message.trim() ? (
              <button
                onClick={handleSubmit}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white transition-all duration-200 active:scale-95 shadow-[0_0_20px_rgba(255,140,0,0.4)]`}
                style={{ background: 'linear-gradient(135deg, #FF8C00, #E85D00)' }}
              >
                <span className="hidden sm:inline">{t('sendButton', language)}</span>
                <Send className="size-4" />
              </button>
            ) : (
                <div className="relative z-50">
                  <MicButton 
                    language={language}
                    getPayload={getPayload}
                    onAudioProcessed={(data) => {
                      if (onVoiceResponse) {
                        onVoiceResponse(data);
                      } else if (data.transcript && onSend) {
                        onSend(data.transcript);
                      }
                    }}
                    onStateChange={(state, time, level) => {
                      setRecordingState(state);
                      setRecordingTime(time);
                      setAudioLevel(level);
                    }}
                    onError={(errorMsg) => {
                      if (onVoiceResponse) {
                        onVoiceResponse({ error: errorMsg, text: errorMsg, severity: 'caution' });
                      }
                    }}
                  />
                </div>
            )}
          </div>
        </div>
      </div>

      {/* RECORDING INDICATOR */}
      <div 
        className={`absolute left-0 right-0 overflow-hidden transition-all duration-300 ease-out z-[40] ${
          recordingState !== 'idle' ? 'top-full mt-2 opacity-100 translate-y-0' : 'top-[80%] opacity-0 pointer-events-none -translate-y-2'
        }`}
      >
        <div className="mx-auto w-fit flex items-center justify-between gap-4 bg-[rgba(255,68,68,0.1)] border border-[rgba(255,68,68,0.3)] rounded-xl px-4 py-2.5 backdrop-blur-md">
          <button onClick={() => window.dispatchEvent(new Event('cancel-microphone-recording'))} className="text-[13px] font-bold text-red-400 hover:text-red-300 min-w-[100px] hover:underline cursor-pointer text-left">{t('cancelRecording', language)}</button>
          <div className="flex flex-1 items-center gap-2 justify-center">
             <span className="w-2 h-2 rounded-full bg-[#FF4444] animate-pulse shadow-[0_0_8px_#FF4444]" />
             <span className="text-white font-mono text-sm font-medium">{formatTime(recordingTime)}</span>
          </div>
          <div className="flex items-center justify-end gap-1 min-w-[70px] h-6">
             {renderWaveform(audioLevel)}
          </div>
        </div>
      </div>
    </div>
  )
}

// Ray Background
export function RayBackground() {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none">
      <div className="absolute inset-0 bg-[#060A14]" />
      <div 
        className="absolute left-1/2 -translate-x-1/2 w-[4000px] h-[1800px] sm:w-[6000px]"
        style={{
          background: `radial-gradient(circle at center 800px, rgba(255, 140, 0, 0.15) 0%, rgba(20, 136, 252, 0.35) 14%, rgba(0, 229, 160, 0.08) 18%, rgba(20, 136, 252, 0.08) 22%, rgba(17, 17, 20, 0.2) 25%)`
        }}
      />
      <div 
        className="absolute top-[175px] left-1/2 w-[1600px] h-[1600px] sm:top-1/2 sm:w-[3043px] sm:h-[2865px]"
        style={{ transform: 'translate(-50%) rotate(180deg)' }}
      >
        <div className="absolute w-full h-full rounded-full -mt-[13px]" style={{ background: 'radial-gradient(43.89% 25.74% at 50.02% 97.24%, #111114 0%, #060A14 100%)', border: '16px solid rgba(255,140,0,0.15)', transform: 'rotate(180deg)', zIndex: 5 }} />
        <div className="absolute w-full h-full rounded-full bg-[#060A14] -mt-[11px]" style={{ border: '23px solid rgba(255,140,0,0.25)', transform: 'rotate(180deg)', zIndex: 4 }} />
        <div className="absolute w-full h-full rounded-full bg-[#060A14] -mt-[8px]" style={{ border: '23px solid rgba(0,229,160,0.20)', transform: 'rotate(180deg)', zIndex: 3 }} />
        <div className="absolute w-full h-full rounded-full bg-[#060A14] -mt-[4px]" style={{ border: '23px solid rgba(0,229,160,0.35)', transform: 'rotate(180deg)', zIndex: 2 }} />
        <div className="absolute w-full h-full rounded-full bg-[#060A14]" style={{ border: '20px solid #FF8C00', boxShadow: '0 -15px 24px rgba(255,140,0,0.5)', transform: 'rotate(180deg)', zIndex: 1 }} />
      </div>
    </div>
  )
}

// ANNOUNCEMENT BADGE COMPONENT
export function AnnouncementBadge({ text, href = "#" }: { text: string; href?: string }) {
  const content = (
    <>
      <span className="absolute top-0 left-0 right-0 h-1/2 pointer-events-none opacity-70 mix-blend-overlay" style={{ background: 'radial-gradient(ellipse at center top, rgba(255, 255, 255, 0.15) 0%, transparent 70%)' }} />
      <span className="absolute -top-px left-1/2 -translate-x-1/2 h-[2px] w-[100px] opacity-60" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255, 140, 0, 0.8) 20%, rgba(0, 229, 160, 0.8) 50%, rgba(59, 130, 246, 0.8) 80%, transparent 100%)', filter: 'blur(0.5px)' }} />
      <Mic className="size-4 relative z-10 text-white" />
      <span className={`relative z-10 text-white font-medium ${dmSans.className}`}>{text}</span>
    </>
  )

  const className = "relative inline-flex items-center gap-2 px-5 py-2 min-h-[40px] rounded-full text-sm overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
  const style = {
    background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
    backdropFilter: 'blur(20px) saturate(140%)',
    boxShadow: 'inset 0 1px rgba(255,255,255,0.2), inset 0 -1px rgba(0,0,0,0.1), 0 8px 32px -8px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.08)'
  }

  return href !== '#' ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} style={style}>{content}</a>
  ) : (
    <button className={className} style={style}>{content}</button>
  )
}

// IMPORT BUTTONS COMPONENT
export function ImportButtons({ onImport }: { onImport?: (source: string) => void }) {
  const { language } = useLanguage()

  return (
    <div className={`flex items-center gap-4 justify-center ${dmSans.className}`}>
      <span className="text-sm text-[#6a6a6f]">{t('orGetHelpWith', language)}</span>
      <div className="flex gap-2">
        {[
          { id: 'medicine', name: t('medicineScan', language), icon: <Pill className="size-4" /> },
          { id: 'clinic', name: t('findClinic', language), icon: <MapPin className="size-4" /> }
        ].map((option) => (
          <button
            key={option.id}
            onClick={() => onImport?.(option.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-white/10 bg-[#060A14] hover:bg-[#0D1525] text-[#8a8a8f] hover:text-white transition-all duration-200 active:scale-95"
          >
            {option.icon}
            <span>{option.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// MAIN BOLT CHAT COMPONENT
interface BoltChatProps {
  title?: string
  subtitle?: string
  announcementText?: string
  announcementHref?: string
  placeholder?: string
  heroHighlight?: string
  heroEnding?: string
  onSend?: (message: string) => void
  onVoiceResponse?: (data: any) => void
  onImport?: (source: string) => void
}

export function ArogyaChat({
  title,
  subtitle,
  announcementText,
  announcementHref = "#",
  placeholder,
  heroHighlight,
  heroEnding,
  onSend,
  onVoiceResponse,
  onImport
}: BoltChatProps) {
  const { language } = useLanguage()

  const resolvedTitle = title || t('heroTitle', language)
  const resolvedSubtitle = subtitle || t('heroSubtitle', language)
  const resolvedAnnouncement = announcementText || t('badgeText', language)
  const resolvedPlaceholder = placeholder || t('placeholder', language)
  const resolvedHighlight = heroHighlight || t('heroHighlight', language)
  const resolvedEnding = heroEnding || t('heroEnding', language)

  return (
    <div className={`relative flex flex-col items-center justify-center min-h-screen w-full overflow-hidden bg-[#060A14] ${dmSans.className}`}>
      <RayBackground />
      <div className="absolute top-[70px]">
          <AnnouncementBadge text={resolvedAnnouncement} href={announcementHref} />
        </div>
      {/* Content container */}
      <div className="absolute top-[66%] left-1/2 sm:top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center w-full h-full overflow-hidden px-4">
        {/* Title section */}
        <div className="text-center mb-6">
          <h1 className={`${syne.className} text-4xl sm:text-5xl font-bold text-white tracking-tight mb-1`}>
            {resolvedTitle}{' '}
            <span className="bg-gradient-to-b from-[#FF8C00] to-white bg-clip-text text-transparent italic">
              {resolvedHighlight}
            </span>
            <br className="sm:hidden" /> {resolvedEnding}
          </h1>
          <p className="text-base font-semibold sm:text-lg text-[rgba(255,255,255,0.4)] whitespace-pre-line leading-relaxed max-w-[500px] mx-auto mt-3">
            {resolvedSubtitle}
          </p>
        </div>

        {/* Chat input */}
        <div className="w-full max-w-[700px] mb-6 sm:mb-8 mt-2">
          <ChatInput placeholder={resolvedPlaceholder} onSend={onSend} onVoiceResponse={onVoiceResponse} />
        </div>

        {/* Import buttons */}
        <ImportButtons onImport={onImport} />
      </div>
    </div>
  )
}
