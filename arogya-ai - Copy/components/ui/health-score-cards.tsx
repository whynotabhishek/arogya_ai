"use client"

import type React from "react"
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { LiquidCard, CardContent, CardHeader } from "@/components/ui/liquid-glass-card"
import { LiquidButton } from "@/components/ui/liquid-glass-button"

// Types and Enums
enum Strength {
  None = "none",
  Weak = "High Risk",
  Moderate = "Monitor",
  Strong = "Healthy",
}

interface HealthScoreProps {
  id: string
  title: string
  description: string
  initialScore?: number | null
}

interface HealthScoreButtonProps {
  children?: React.ReactNode
  isOutlined?: boolean
  onClick?: () => void
}

interface HealthScoreCardProps {
  children?: React.ReactNode
}

interface HealthScoreDisplayProps {
  value: Score
  max: number
}

interface HealthScoreHalfCircleProps {
  value: Score
  max: number
  id: string
}

interface HealthScoreHeaderProps {
  title?: string
  strength?: Strength
}

type CounterContextType = {
  getNextIndex: () => number
}

type Score = number | null
type StrengthColors = Record<Strength, string[]>
type ScoreMap = Record<string, number>

// Sample Data
const data: HealthScoreProps[] = [
  {
    id: "overall",
    title: "Overall Health Score",
    description:
      "Based on your reported symptoms and history. Higher score means better health patterns detected. Keep tracking daily.",
    initialScore: null,
  },
  {
    id: "symptoms",
    title: "Symptom Risk Score",
    description:
      "Measures severity of symptoms reported this week. Lower risk score means your symptoms are mild and manageable.",
    initialScore: null,
  },
  {
    id: "adherence",
    title: "Medicine Adherence",
    description:
      "Tracks how consistently you follow your medicine reminders. Regular adherence leads to better health outcomes.",
    initialScore: null,
  }
]

// Utils Class
class Utils {
  static LOCALE = "en-US"

  static easings = {
    easeInOut: "cubic-bezier(0.65, 0, 0.35, 1)",
    easeOut: "cubic-bezier(0.33, 1, 0.68, 1)",
  }

  static circumference(r: number): number {
    return 2 * Math.PI * r
  }

  static formatNumber(n: number) {
    return new Intl.NumberFormat(this.LOCALE).format(n)
  }

  static getStrength(score: Score, maxScore: number, id: string): Strength {
    if (score === null) return Strength.None

    const percent = score / maxScore

    if (id === 'symptoms') {
      if (percent >= 0.7) return Strength.Weak
      if (percent >= 0.4) return Strength.Moderate
      return Strength.Strong
    } else {
      if (percent >= 0.8) return Strength.Strong
      if (percent >= 0.4) return Strength.Moderate
      return Strength.Weak
    }
  }

  static randomHash(length = 4): string {
    const chars = "abcdef0123456789"
    const bytes = crypto.getRandomValues(new Uint8Array(length))

    return [...bytes].map((b) => chars[b % chars.length]).join("")
  }

  static randomInt(min = 0, max = 1): number {
    const value = crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32

    return Math.round(min + (max - min) * value)
  }
}

// Context
const CounterContext = createContext<CounterContextType | undefined>(undefined)

const CounterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const counterRef = useRef(0)
  const getNextIndex = useCallback(() => {
    return counterRef.current++
  }, [])

  return <CounterContext.Provider value={{ getNextIndex }}>{children}</CounterContext.Provider>
}

const useCounter = () => {
  const context = useContext(CounterContext)

  if (!context) {
    throw new Error("useCounter must be used within a CounterProvider")
  }

  return context.getNextIndex
}

// Components
function HealthScoreButton({ children, isOutlined, onClick }: HealthScoreButtonProps) {
  return (
    <LiquidButton
      variant={"default"}
      onClick={onClick}
      className={`w-full h-14 rounded-full text-[15px] font-semibold tracking-wide animate-in fade-in slide-in-from-bottom-12 duration-800 delay-300 ${isOutlined ? '' : 'shadow-[0_0_20px_rgba(255,140,0,0.3)]'
        }`}
      style={isOutlined ? {
        border: '1px solid rgba(0,229,160,0.3)',
        color: '#00E5A0',
        background: 'transparent'
      } : {
        background: 'linear-gradient(135deg, #FF8C00, #E85D00)',
        color: 'white',
        border: 'none'
      }}
    >
      {children}
    </LiquidButton>
  )
}

function HealthScoreCard({ children }: HealthScoreCardProps) {
  const getNextIndex = useCounter()
  const indexRef = useRef<number | null>(null)
  const animationRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [appearing, setAppearing] = useState(false)

  if (indexRef.current === null) {
    indexRef.current = getNextIndex()
  }

  useEffect(() => {
    const delayInc = 200
    const delay = 300 + indexRef.current! * delayInc

    animationRef.current = setTimeout(() => setAppearing(true), delay)

    return () => {
      if (animationRef.current) clearTimeout(animationRef.current)
    }
  }, [])

  if (!appearing) return null

  return (
    <LiquidCard
      className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-800 fill-mode-both"
      style={{
        background: 'rgba(13,21,37,0.8)',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)'
      }}
    >
      <CardContent className="p-9">{children}</CardContent>
    </LiquidCard>
  )
}

function HealthScoreDisplay({ value, max }: HealthScoreDisplayProps) {
  const hasValue = value !== null
  const digits = String(Math.floor(value || 0)).split("")
  const maxFormatted = Utils.formatNumber(max)
  const label = hasValue ? `out of ${maxFormatted}` : "No score"

  return (
    <div className="absolute bottom-0 w-full text-center">
      <div className="text-4xl font-medium h-15 overflow-hidden relative text-white">
        <div className="absolute inset-0 opacity-0">
          <div className="inline-block">0</div>
        </div>
        <div className="absolute inset-0">
          {hasValue &&
            digits.map((digit, i) => (
              <span
                key={i}
                className="inline-block animate-in slide-in-from-bottom-full duration-800 delay-400 fill-mode-both"
                style={{
                  animationDelay: `${400 + i * 100}ms`,
                  animationDuration: `${800 + i * 300}ms`,
                }}
              >
                {digit}
              </span>
            ))}
        </div>
      </div>
      <div className="text-sm uppercase tracking-wide mt-2" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</div>
    </div>
  )
}

function HealthScoreHalfCircle({ value, max, id }: HealthScoreHalfCircleProps) {
  const strokeRef = useRef<SVGCircleElement>(null)
  const gradIdRef = useRef(`grad-${Utils.randomHash()}`)
  const gradId = gradIdRef.current
  const gradStroke = `url(#${gradId})`
  const radius = 45
  const dist = Utils.circumference(radius)
  const distHalf = dist / 2
  const distFourth = distHalf / 2
  const strokeDasharray = `${distHalf} ${distHalf}`
  const distForValue = Math.min((value as number) / max, 1) * -distHalf
  const strokeDashoffset = value !== null ? distForValue : -distFourth
  const strength = Utils.getStrength(value, max, id)
  const strengthColors: StrengthColors = {
    [Strength.None]: ["rgba(255,255,255,0.2)", "rgba(255,255,255,0.1)"],
    [Strength.Weak]: ["#FF4444", "#CC0000"],
    [Strength.Moderate]: ["#F59E0B", "#D97706"],
    [Strength.Strong]: ["#00E5A0", "#00B37D"],
  }
  const colorStops = strengthColors[strength]

  useEffect(() => {
    const strokeStart = 400
    const duration = 1400

    strokeRef.current?.animate(
      [
        { strokeDashoffset: "0", offset: 0 },
        { strokeDashoffset: "0", offset: strokeStart / duration },
        { strokeDashoffset: strokeDashoffset.toString() },
      ],
      {
        duration,
        easing: Utils.easings.easeInOut,
        fill: "forwards",
      },
    )
  }, [value, max, strokeDashoffset])

  return (
    <svg className="block mx-auto w-auto max-w-full h-36" viewBox="0 0 100 50" aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
          {colorStops.map((stop, i) => {
            const offset = `${(100 / (colorStops.length - 1)) * i}%`
            return <stop key={i} offset={offset} stopColor={stop} />
          })}
        </linearGradient>
      </defs>
      <g fill="none" strokeWidth="10" transform="translate(50, 50.5)">
        <circle stroke="rgba(255,255,255,0.05)" r={radius} />
        <circle ref={strokeRef} stroke={gradStroke} strokeDasharray={strokeDasharray} r={radius} />
      </g>
    </svg>
  )
}

function HealthScoreHeader({ title, strength }: HealthScoreHeaderProps) {
  const hasStrength = strength !== Strength.None

  const getBadgeClassName = (strength: Strength) => {
    switch (strength) {
      case Strength.Weak:
        return "bg-red-900/30 text-red-300 border-red-500/30 hover:bg-red-900/40"
      case Strength.Moderate:
        return "bg-amber-900/30 text-amber-300 border-amber-500/30 hover:bg-amber-900/40"
      case Strength.Strong:
        return "bg-green-900/30 text-green-300 border-green-500/30 hover:bg-green-900/40"
      default:
        return ""
    }
  }

  return (
    <CardHeader className="flex flex-row items-center justify-between gap-6 pb-10 px-0 animate-in fade-in slide-in-from-bottom-12 duration-800 delay-0">
      <h2 className="text-xl font-bold truncate" style={{ color: 'rgba(255,255,255,0.9)', fontFamily: "'Syne', sans-serif" }}>{title}</h2>
      {hasStrength && (
        <div
          className={`px-3 py-1 rounded-full uppercase text-[10px] sm:text-xs font-semibold shrink-0 animate-in fade-in slide-in-from-bottom-12 border duration-800 delay-800 ${getBadgeClassName(strength as Strength)}`}
        >
          {strength}
        </div>
      )}
    </CardHeader>
  )
}

function HealthScore({ id, title, description, initialScore }: HealthScoreProps) {
  const [score, setScore] = useState<Score>(initialScore ?? null)
  const hasScore = score !== null
  const max = 100
  const strength = Utils.getStrength(score, max, id)

  useEffect(() => {
    if (initialScore !== null && initialScore !== undefined) {
      setScore(initialScore);
    }
  }, [initialScore])

  function handleGenerateScore(): void {
    if (typeof window === 'undefined') return
    const nextScores = buildScoresFromMemory()
    setScore(nextScores[id] ?? 50)
  }

  return (
    <HealthScoreCard>
      <HealthScoreHeader title={title} strength={strength} />
      <div className="relative mb-8 pt-4 animate-in fade-in slide-in-from-bottom-12 duration-800 delay-100">
        <HealthScoreHalfCircle value={score} max={max} id={id} />
        <HealthScoreDisplay value={score} max={max} />
      </div>
      <p className="text-center mb-9 min-h-[4.5rem] animate-in fade-in slide-in-from-bottom-12 duration-800 delay-200 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
        {description}
      </p>
      <HealthScoreButton isOutlined={hasScore} onClick={handleGenerateScore}>
        {"Refresh Score"}
      </HealthScoreButton>
    </HealthScoreCard>
  )
}

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value))
}

function buildScoresFromMemory(): ScoreMap {
  if (typeof window === 'undefined') {
    return {
      overall: 50,
      symptoms: 50,
      adherence: 50,
    }
  }

  const riskScore = parseInt(localStorage.getItem('arogya_risk') || '0', 10) || 0
  const symptoms = safeJsonParse<Array<{ count?: number; severity?: string }>>(localStorage.getItem('arogya_symptoms'), [])
  const history = safeJsonParse<Array<{ role?: string; text?: string }>>(localStorage.getItem('arogya_history'), [])
  const profile = safeJsonParse<{ chronicConditions?: string[]; emergencyContact?: string; bloodGroup?: string } | null>(localStorage.getItem('arogya_profile'), null)
  const reminders = safeJsonParse<Array<{ id: string }>>(localStorage.getItem('arogya_reminders'), [])

  const symptomCount = symptoms.reduce((acc, item) => acc + (item.count || 0), 0)
  const severeSymptomCount = symptoms.filter((item) => ["high", "urgent", "critical"].includes((item.severity || '').toLowerCase())).length
  const userMessages = history.filter((m) => m.role === 'user').length
  const hasProfile = Boolean(profile)
  const chronicCount = profile?.chronicConditions?.filter((c) => c !== 'None').length || 0

  const overall = clamp(100 - riskScore + (hasProfile ? 6 : 0) - chronicCount * 4)
  const symptomRisk = clamp(20 + symptomCount * 8 + severeSymptomCount * 12 + Math.min(userMessages, 6) * 3)
  const adherenceBase = reminders.length > 0 ? 85 : 55
  const adherence = clamp(adherenceBase + (profile?.emergencyContact ? 5 : 0) + (profile?.bloodGroup ? 3 : 0))

  return {
    overall,
    symptoms: symptomRisk,
    adherence,
  }
}

// Main Component
export function HealthScoreCards() {
  const [scores, setScores] = useState<ScoreMap>({
    overall: 50,
    symptoms: 50,
    adherence: 50,
  })

  useEffect(() => {
    const updateFromMemory = () => setScores(buildScoresFromMemory())

    updateFromMemory()
    window.addEventListener('storage', updateFromMemory)

    const intervalId = window.setInterval(updateFromMemory, 2500)
    return () => {
      window.removeEventListener('storage', updateFromMemory)
      window.clearInterval(intervalId)
    }
  }, [])

  return (
    <div className="flex flex-wrap items-center justify-center gap-6 mx-auto py-12 px-6 bg-[#060A14] w-full max-w-[1400px]">
      <CounterProvider>
        {data.map((card, i) => (
          <HealthScore key={i} {...card} initialScore={scores[card.id]} />
        ))}
      </CounterProvider>
    </div>
  )
}
