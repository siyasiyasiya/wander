'use client'

import type { InkTheme } from '@/lib/theme'
import type { TravelMode } from '@/lib/isochrone/types'

interface EmptyStateProps {
  theme: InkTheme
  intentText: string
  timeBudget: number
  travelMode: TravelMode
  openOnly: boolean
  onStretchTime: () => void
  onSwitchMode: () => void
  onShowClosed: () => void
}

export function EmptyState({
  theme: t,
  intentText,
  timeBudget,
  travelMode,
  openOnly,
  onStretchTime,
  onSwitchMode,
  onShowClosed,
}: EmptyStateProps) {
  const nextMode = travelMode === 'walk' ? 'drive' : travelMode === 'drive' ? 'bike' : 'walk'

  return (
    <div className="flex-1 p-6 flex flex-col gap-3.5 border-t" style={{ borderColor: t.line }}>
      <p className="m-0 font-serif text-[21px] leading-tight [text-wrap:pretty]" style={{ color: t.ink }}>
        Nothing reachable{intentText ? ` matching “${intentText}”` : ''} inside a {timeBudget}-minute {travelMode}.
      </p>
      <p className="m-0 text-[12.5px] leading-relaxed" style={{ color: t.muted }}>
        Try stretching the time, switching how you&rsquo;re getting there, or including closed places.
      </p>
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={onStretchTime}
          className="px-3 py-1.5 rounded-full border text-xs font-semibold cursor-pointer"
          style={{ borderColor: t.border, color: t.accentText }}
        >
          Stretch to {Math.min(timeBudget + 15, 90)} min
        </button>
        <button
          onClick={onSwitchMode}
          className="px-3 py-1.5 rounded-full border text-xs font-semibold cursor-pointer capitalize"
          style={{ borderColor: t.border, color: t.accentText }}
        >
          Switch to {nextMode}
        </button>
        {openOnly && (
          <button
            onClick={onShowClosed}
            className="px-3 py-1.5 rounded-full border text-xs font-medium cursor-pointer"
            style={{ borderColor: t.border, color: t.muted }}
          >
            Show closed too
          </button>
        )}
      </div>
    </div>
  )
}
