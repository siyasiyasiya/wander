'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { MapProvider } from '@/components/providers/MapProvider'
import { MapCanvas } from '@/components/map/MapCanvas'
import { SearchPanel } from '@/components/controls/SearchPanel'
import { ResultsList } from '@/components/controls/ResultsList'
import type { GeoJSONPolygon, TravelMode } from '@/lib/isochrone/types'
import type { PlaceBase } from '@/lib/places/types'

interface Origin { lat: number; lng: number }

export function AppShell() {
  const [origin, setOrigin] = useState<Origin | null>(null)
  const [timeBudget, setTimeBudget] = useState(20)
  const [travelMode, setTravelMode] = useState<TravelMode>('walk')
  const [category, setCategory] = useState('')
  const [polygon, setPolygon] = useState<GeoJSONPolygon | null>(null)
  const [places, setPlaces] = useState<PlaceBase[]>([])
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Debounce category so we don't re-query on every keystroke
  const categoryDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [debouncedCategory, setDebouncedCategory] = useState('')

  const handleCategoryChange = useCallback((val: string) => {
    setCategory(val)
    if (categoryDebounceRef.current) clearTimeout(categoryDebounceRef.current)
    categoryDebounceRef.current = setTimeout(() => setDebouncedCategory(val), 400)
  }, [])

  const fetchIsochrone = useCallback(async (lat: number, lng: number, mode: TravelMode, budget: number) => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/isochrone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng, mode, seconds: budget * 60 }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setPolygon(await res.json())
    } catch (err) {
      console.error('[isochrone]', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchPlaces = useCallback(async (poly: GeoJSONPolygon, cat: string) => {
    try {
      const res = await fetch('/api/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ polygon: poly, category: cat || undefined }),
      })
      setPlaces(await res.json())
    } catch (err) {
      console.error('[places]', err)
    }
  }, [])

  const handleOriginSet = useCallback((lat: number, lng: number) => {
    setOrigin({ lat, lng })
  }, [])

  // Re-fetch isochrone when origin, mode, or time changes
  useEffect(() => {
    if (!origin) return
    fetchIsochrone(origin.lat, origin.lng, travelMode, timeBudget)
  }, [origin, travelMode, timeBudget, fetchIsochrone])

  // Re-fetch places when polygon or category changes
  useEffect(() => {
    if (!polygon) return
    setSelectedPlaceId(null)
    fetchPlaces(polygon, debouncedCategory)
  }, [polygon, debouncedCategory, fetchPlaces])

  return (
    <MapProvider>
      <div className="flex h-full">
        <aside className="w-72 flex-shrink-0 bg-white border-r border-zinc-100 flex flex-col overflow-hidden">
          <SearchPanel
            timeBudget={timeBudget}
            travelMode={travelMode}
            category={category}
            hasOrigin={origin !== null}
            isLoading={isLoading}
            onTimeBudgetChange={setTimeBudget}
            onTravelModeChange={setTravelMode}
            onCategoryChange={handleCategoryChange}
          />
          <div className="flex-1 overflow-y-auto">
            {origin && (
              <ResultsList
                places={places}
                origin={origin}
                selectedPlaceId={selectedPlaceId}
                onPlaceSelect={setSelectedPlaceId}
              />
            )}
          </div>
        </aside>
        <main className="flex-1 relative">
          <MapCanvas
            polygon={polygon}
            places={places}
            selectedPlaceId={selectedPlaceId}
            onOriginSet={handleOriginSet}
            onPlaceSelect={setSelectedPlaceId}
          />
        </main>
      </div>
    </MapProvider>
  )
}
