'use client'

import type { InkTheme } from '@/lib/theme'
import type { EnrichedPlace } from '@/lib/places/mockEnrich'
import type { TravelMode } from '@/lib/isochrone/types'

const GMAPS_TRAVEL_MODE: Record<TravelMode, string> = { walk: 'walking', bike: 'bicycling', drive: 'driving' }

interface DetailPanelProps {
  theme: InkTheme
  place: EnrichedPlace
  origin: { lat: number; lng: number }
  travelMode: TravelMode
  dist: string
  slackMinutes: number
  onBack: () => void
  onNotForMe: () => void
}

export function DetailPanel({ theme: t, place, origin, travelMode, dist, slackMinutes, onBack, onNotForMe }: DetailPanelProps) {
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${place.lat},${place.lng}&travelmode=${GMAPS_TRAVEL_MODE[travelMode]}`

  const rows = [
    place.isLiveData && place.hoursToday ? { k: 'Today', v: place.hoursToday } : null,
    { k: 'Status', v: place.openLabel },
    { k: 'Inside your edge by', v: slackMinutes > 0 ? `${slackMinutes} min of slack` : 'right at the edge' },
  ].filter((r): r is { k: string; v: string } => r !== null)

  return (
    <div className="flex-1 flex flex-col border-t overflow-y-auto" style={{ borderColor: t.line }}>
      <div className="px-6 py-2.5 border-b" style={{ borderColor: t.line, background: t.field }}>
        <span onClick={onBack} className="font-mono text-[9.5px] tracking-wide uppercase cursor-pointer" style={{ color: t.accentText }}>
          ← back to the list
        </span>
      </div>

      <div className="px-6 py-5 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline gap-2.5">
            <span className="font-serif text-[26px] font-medium leading-none tracking-tight" style={{ color: t.ink }}>
              {place.name}
            </span>
            <span className="ml-auto font-mono text-[9px] tracking-wide uppercase" style={{ color: t.accentText }}>
              {place.tag}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[12.5px] font-semibold" style={{ color: t.ink }}>
              {place.rating}
            </span>
            <span className="text-xs" style={{ color: t.faint }}>
              {place.reviewsLabel}
            </span>
            <Dot color={t.border} />
            <span className="text-xs font-medium" style={{ color: t.ok }}>
              {place.openLabel}
            </span>
            <Dot color={t.border} />
            <span className="text-xs" style={{ color: t.muted }}>
              {dist}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 pl-3.5 border-l-2" style={{ borderColor: t.accent }}>
          <span className="font-mono text-[9px] tracking-widest uppercase" style={{ color: t.faint }}>
            Why this one
          </span>
          <p className="m-0 font-serif italic text-[16.5px] leading-snug [text-wrap:pretty]" style={{ color: t.ink }}>
            “{place.quote}”
          </p>
          <p className="m-0 text-[12.5px] leading-relaxed [text-wrap:pretty]" style={{ color: t.muted }}>
            {place.why}
          </p>
          {place.googleMapsUri ? (
            <a
              href={place.googleMapsUri}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] no-underline"
              style={{ color: t.faint }}
            >
              View on Google Maps ↗
            </a>
          ) : (
            <span className="text-[10px]" style={{ color: t.faint }}>
              {place.src} · ratings and hours are illustrative placeholders
            </span>
          )}
        </div>

        <div className="flex flex-col rounded-[10px] border overflow-hidden" style={{ borderColor: t.line }}>
          {rows.map((r) => (
            <div key={r.k} className="flex justify-between px-3.5 py-2.5 border-b last:border-b-0" style={{ borderColor: t.hair }}>
              <span className="font-mono text-[9.5px] tracking-wide uppercase" style={{ color: t.faint }}>
                {r.k}
              </span>
              <span className="text-xs font-medium" style={{ color: t.ink }}>
                {r.v}
              </span>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center py-2.5 rounded-[10px] text-[13px] font-semibold no-underline"
            style={{ background: t.accent, color: t.onAccent }}
          >
            Directions
          </a>
          <button
            onClick={onNotForMe}
            className="px-3.5 py-2.5 rounded-[10px] border text-[13px] font-medium cursor-pointer"
            style={{ borderColor: t.border, color: t.muted }}
          >
            Not for me
          </button>
        </div>
      </div>
    </div>
  )
}

function Dot({ color }: { color: string }) {
  return <span className="w-[3px] h-[3px] rounded-full flex-none inline-block" style={{ background: color }} />
}
