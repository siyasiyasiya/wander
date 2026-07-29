'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import type { InkTheme, IntentMode } from '@/lib/theme'
import { STOP_LABELS, READBACK } from '@/lib/theme'
import type { TravelMode } from '@/lib/isochrone/types'

const MODES: { value: TravelMode; label: string }[] = [
  { value: 'walk', label: 'Walk' },
  { value: 'drive', label: 'Drive' },
  { value: 'bike', label: 'Bike' },
]

const MIN_BUDGET = 5
const MAX_BUDGET = 90

interface IntentPanelProps {
  theme: InkTheme
  intentMode: IntentMode
  intentText: string
  timeBudget: number
  travelMode: TravelMode
  isFirstRun: boolean
  onIntentModeChange: (m: IntentMode) => void
  onIntentTextChange: (v: string) => void
  onTimeBudgetChange: (v: number) => void
  onTravelModeChange: (m: TravelMode) => void
}

export function IntentPanel({
  theme: t,
  intentMode,
  intentText,
  timeBudget,
  travelMode,
  isFirstRun,
  onIntentModeChange,
  onIntentTextChange,
  onTimeBudgetChange,
  onTravelModeChange,
}: IntentPanelProps) {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    // Client-only clock: seeding this from render would render a server
    // timestamp that mismatches the client's on hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  const pct = ((timeBudget - MIN_BUDGET) / (MAX_BUDGET - MIN_BUDGET)) * 100
  const sliderStyle: CSSProperties = {
    background: `linear-gradient(to right, ${t.accent} ${pct}%, ${t.trackBg} ${pct}%)`,
    ['--accent' as string]: t.accent,
    ['--panel-bg' as string]: t.panel,
  }

  return (
    <div className="flex-none" style={{ background: t.panel }}>
      <div className="px-6 pt-5 flex items-baseline justify-between">
        <div className="flex items-baseline gap-2">
          <span className="font-serif text-[22px] font-medium tracking-tight" style={{ color: t.ink }}>
            Wander
          </span>
          <span className="w-[5px] h-[5px] rounded-full inline-block -translate-y-1" style={{ background: t.accent }} />
        </div>
        <span className="font-mono text-[9.5px] tracking-wider uppercase" style={{ color: t.faint }}>
          {now ? now.toLocaleTimeString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' }) : ' '}
        </span>
      </div>

      <div className="px-6 pt-4 flex flex-col gap-3">
        <div
          className="flex items-center gap-2.5 rounded-xl px-3.5 py-3 border"
          style={{ borderColor: t.border, background: t.field }}
        >
          <span className="w-[13px] h-[13px] rounded-full flex-none border-[1.5px]" style={{ borderColor: t.faint }} />
          <input
            type="text"
            value={intentText}
            onChange={(e) => onIntentTextChange(e.target.value)}
            placeholder="What are you after?"
            className="flex-1 bg-transparent text-[15px] font-medium outline-none min-w-0"
            style={{ color: t.ink }}
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex p-[3px] rounded-[11px] border" style={{ background: t.trackBg, borderColor: t.line }}>
            {([0, 1, 2] as IntentMode[]).map((m) => (
              <span
                key={m}
                onClick={() => onIntentModeChange(m)}
                className="flex-1 text-center py-[7px] rounded-lg text-[11.5px] cursor-pointer select-none"
                style={{
                  fontWeight: m === intentMode ? 600 : 500,
                  background: m === intentMode ? t.panel : 'transparent',
                  color: m === intentMode ? t.accentText : t.muted,
                  boxShadow: m === intentMode ? '0 1px 3px rgba(20,32,15,.14)' : 'none',
                }}
              >
                {STOP_LABELS[m]}
              </span>
            ))}
          </div>
          <div className="flex items-start gap-2">
            <span className="w-[5px] h-[5px] rounded-full mt-[5px] flex-none" style={{ background: t.accent }} />
            <p className="m-0 text-[11.5px] leading-relaxed [text-wrap:pretty]" style={{ color: t.muted }}>
              {isFirstRun
                ? 'Anything from “a dentist” to “surprise me” — how you phrase it sets how surprising the answers get.'
                : READBACK[intentMode]}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 pb-[15px] border-b" style={{ borderColor: t.line }}>
          <input
            type="range"
            min={MIN_BUDGET}
            max={MAX_BUDGET}
            step={5}
            value={timeBudget}
            onChange={(e) => onTimeBudgetChange(Number(e.target.value))}
            className="dial flex-1"
            style={sliderStyle}
          />
          <span className="font-mono text-[11px] font-medium flex-none" style={{ color: t.accentText }}>
            {timeBudget} MIN
          </span>
          <div className="flex gap-1 flex-none">
            {MODES.map(({ value, label }) => (
              <span
                key={value}
                onClick={() => onTravelModeChange(value)}
                className="px-2.5 py-1.5 rounded-lg text-[11.5px] font-medium cursor-pointer select-none border"
                style={
                  travelMode === value
                    ? { background: t.accent, color: t.onAccent, borderColor: t.accent }
                    : { color: t.muted, borderColor: t.border, background: 'transparent' }
                }
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
