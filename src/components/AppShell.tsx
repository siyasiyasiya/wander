'use client'

import { useState, useCallback, useEffect } from 'react'
import { MapProvider } from '@/components/providers/MapProvider'
import { MapCanvas } from '@/components/map/MapCanvas'
import { SearchPanel } from '@/components/controls/SearchPanel'
import type { GeoJSONPolygon, TravelMode } from '@/lib/isochrone/types'

interface Origin {
  lat: number
  lng: number
}

export function AppShell() {
  const [origin, setOrigin] = useState<Origin | null>(null)
  const [timeBudget, setTimeBudget] = useState(20)
  const [travelMode, setTravelMode] = useState<TravelMode>('walk')
  const [polygon, setPolygon] = useState<GeoJSONPolygon | null>(null)
  const [isLoading, setIsLoading] = useState(false)

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

  // When user clicks the map, set origin and immediately fetch
  const handleOriginSet = useCallback((lat: number, lng: number) => {
    setOrigin({ lat, lng })
  }, [])

  // Re-fetch whenever origin, mode, or time changes
  useEffect(() => {
    if (!origin) return
    fetchIsochrone(origin.lat, origin.lng, travelMode, timeBudget)
  }, [origin, travelMode, timeBudget, fetchIsochrone])

  return (
    <MapProvider>
      <div className="flex h-full">
        <aside className="w-72 flex-shrink-0 bg-white border-r border-zinc-100 overflow-y-auto">
          <SearchPanel
            timeBudget={timeBudget}
            travelMode={travelMode}
            hasOrigin={origin !== null}
            isLoading={isLoading}
            onTimeBudgetChange={setTimeBudget}
            onTravelModeChange={setTravelMode}
          />
        </aside>
        <main className="flex-1 relative">
          <MapCanvas polygon={polygon} onOriginSet={handleOriginSet} />
        </main>
      </div>
    </MapProvider>
  )
}
