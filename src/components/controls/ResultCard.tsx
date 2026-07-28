'use client'

import { haversineKm, formatDistance } from '@/lib/utils/distance'
import type { PlaceBase } from '@/lib/places/types'

interface ResultCardProps {
  place: PlaceBase
  origin: { lat: number; lng: number }
  isSelected: boolean
  onClick: () => void
}

export function ResultCard({ place, origin, isSelected, onClick }: ResultCardProps) {
  const dist = haversineKm(origin.lat, origin.lng, place.lat, place.lng)

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-zinc-100 transition-colors ${
        isSelected ? 'bg-indigo-50' : 'hover:bg-zinc-50'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium text-zinc-900 leading-snug">{place.name}</span>
        <span className="text-xs text-zinc-400 shrink-0 mt-0.5">{formatDistance(dist)}</span>
      </div>

      {place.categories.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {place.categories.slice(0, 3).map((cat) => (
            <span
              key={cat}
              className="text-xs px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500"
            >
              {cat}
            </span>
          ))}
        </div>
      )}

      {/* Rating placeholder — populated in Phase 3 */}
      <div className="mt-1.5 h-3 w-20 rounded bg-zinc-100" />
    </button>
  )
}
