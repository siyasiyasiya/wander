'use client'

import { ResultCard } from './ResultCard'
import type { PlaceBase } from '@/lib/places/types'

interface ResultsListProps {
  places: PlaceBase[]
  origin: { lat: number; lng: number }
  selectedPlaceId: string | null
  onPlaceSelect: (id: string) => void
}

export function ResultsList({ places, origin, selectedPlaceId, onPlaceSelect }: ResultsListProps) {
  if (places.length === 0) {
    return (
      <p className="px-4 py-6 text-sm text-zinc-400 text-center">
        Nothing found in this area.
      </p>
    )
  }

  return (
    <div className="flex flex-col">
      <p className="px-4 py-2 text-xs text-zinc-400 font-medium uppercase tracking-wide border-b border-zinc-100">
        {places.length} place{places.length !== 1 ? 's' : ''} nearby
      </p>
      {places.map((place) => (
        <ResultCard
          key={place.place_id}
          place={place}
          origin={origin}
          isSelected={place.place_id === selectedPlaceId}
          onClick={() => onPlaceSelect(place.place_id)}
        />
      ))}
    </div>
  )
}
