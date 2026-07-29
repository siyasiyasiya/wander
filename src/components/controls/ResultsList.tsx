'use client'

import { PlaceRow } from './PlaceRow'
import type { InkTheme, IntentMode } from '@/lib/theme'
import type { EnrichedPlace } from '@/lib/places/mockEnrich'
import type { TravelMode } from '@/lib/isochrone/types'
import { estimateTravelMinutes, formatMinutes } from '@/lib/utils/travel'
import { haversineKm } from '@/lib/utils/distance'

interface ResultsListProps {
  places: EnrichedPlace[]
  visibleCount: number
  totalCount: number
  mode: IntentMode
  origin: { lat: number; lng: number }
  travelMode: TravelMode
  selectedPlaceId: string | null
  theme: InkTheme
  onPlaceSelect: (id: string) => void
  onShowAll: () => void
  onReroll: () => void
}

export function ResultsList({
  places,
  visibleCount,
  totalCount,
  mode,
  origin,
  travelMode,
  selectedPlaceId,
  theme: t,
  onPlaceSelect,
  onShowAll,
  onReroll,
}: ResultsListProps) {
  const variant = mode === 0 ? 'tight' : mode === 1 ? 'mid' : 'wild'
  const visible = variant === 'wild' ? places : places.slice(0, visibleCount)
  const remaining = variant === 'wild' ? [] : places.slice(visibleCount)
  const remainingOpen = remaining.filter((p) => p.isOpenNow).length

  const listHead =
    variant === 'tight'
      ? `${totalCount} reachable · ranked`
      : variant === 'mid'
        ? `${visible.length} that fit the mood`
        : `Tonight’s ${visible.length}`

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-6 py-2.5 border-t border-b flex-none" style={{ borderColor: t.line }}>
        <span className="font-mono text-[9.5px] tracking-widest uppercase" style={{ color: t.faint }}>
          {listHead}
        </span>
        {variant === 'wild' && (
          <span onClick={onReroll} className="font-mono text-[9.5px] tracking-wide uppercase cursor-pointer" style={{ color: t.muted }}>
            Reroll
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {visible.length === 0 ? (
          <p className="px-6 py-6 text-sm text-center" style={{ color: t.faint }}>
            Nothing to show.
          </p>
        ) : (
          visible.map((place, i) => {
            const distKm = haversineKm(origin.lat, origin.lng, place.lat, place.lng)
            const dist = formatMinutes(estimateTravelMinutes(distKm, travelMode))
            return (
              <PlaceRow
                key={place.place_id}
                place={place}
                idx={i}
                dist={dist}
                variant={variant}
                isSelected={place.place_id === selectedPlaceId}
                theme={t}
                onClick={() => onPlaceSelect(place.place_id)}
              />
            )
          })
        )}

        {variant !== 'wild' && remaining.length > 0 && (
          <div onClick={onShowAll} className="flex items-center justify-between px-6 py-3 cursor-pointer">
            <span className="text-[12.5px] font-semibold" style={{ color: t.accentText }}>
              Show all {totalCount} {variant === 'tight' ? 'reachable' : 'that fit'}
            </span>
            <span className="text-[11px]" style={{ color: t.faint }}>
              {remaining.length} more · {remainingOpen === remaining.length ? 'all open now' : `${remainingOpen} open now`}
            </span>
          </div>
        )}
      </div>

      {variant === 'wild' && (
        <div
          onClick={onReroll}
          className="flex-none mx-6 my-3.5 px-4 py-3.5 rounded-xl border border-dashed flex items-center justify-between cursor-pointer"
          style={{ borderColor: t.border, background: t.field }}
        >
          <span className="text-[13px] font-semibold" style={{ color: t.accentText }}>
            Deal three more
          </span>
          <span className="text-[10.5px]" style={{ color: t.faint }}>
            {totalCount} inside this edge
          </span>
        </div>
      )}
    </div>
  )
}
