'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { MapProvider } from '@/components/providers/MapProvider'
import { MapCanvas } from '@/components/map/MapCanvas'
import { IntentPanel } from '@/components/controls/IntentPanel'
import { FirstRunHint } from '@/components/controls/FirstRunHint'
import { LoadingSkeleton } from '@/components/controls/LoadingSkeleton'
import { EmptyState } from '@/components/controls/EmptyState'
import { DetailPanel } from '@/components/controls/DetailPanel'
import { ResultsList } from '@/components/controls/ResultsList'
import { getInkTheme, type IntentMode } from '@/lib/theme'
import { enrichPlace } from '@/lib/places/mockEnrich'
import { haversineKm } from '@/lib/utils/distance'
import { estimateTravelMinutes } from '@/lib/utils/travel'
import { polygonAreaKm2 } from '@/lib/utils/geo'
import { seededShuffle } from '@/lib/utils/shuffle'
import type { GeoJSONPolygon, TravelMode } from '@/lib/isochrone/types'
import type { PlaceBase } from '@/lib/places/types'

interface Origin {
  lat: number
  lng: number
}

const TRAVEL_CYCLE: TravelMode[] = ['walk', 'drive', 'bike']

export function AppShell() {
  const [origin, setOrigin] = useState<Origin | null>(null)
  const [timeBudget, setTimeBudget] = useState(20)
  const [travelMode, setTravelMode] = useState<TravelMode>('walk')
  const [intentMode, setIntentMode] = useState<IntentMode>(1)
  const [intentText, setIntentText] = useState('')
  const [debouncedIntentText, setDebouncedIntentText] = useState('')
  const [polygon, setPolygon] = useState<GeoJSONPolygon | null>(null)
  const [rawPlaces, setRawPlaces] = useState<PlaceBase[]>([])
  const [excludeIds, setExcludeIds] = useState<string[]>([])
  const [openOnly, setOpenOnly] = useState(false)
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(5)
  const [wildSeed, setWildSeed] = useState(0)
  const [isLoadingIsochrone, setIsLoadingIsochrone] = useState(false)
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false)

  const intentDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleIntentTextChange = useCallback((val: string) => {
    setIntentText(val)
    if (intentDebounceRef.current) clearTimeout(intentDebounceRef.current)
    intentDebounceRef.current = setTimeout(() => setDebouncedIntentText(val), 400)
  }, [])

  const fetchIsochrone = useCallback(async (lat: number, lng: number, mode: TravelMode, budget: number) => {
    setIsLoadingIsochrone(true)
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
      setIsLoadingIsochrone(false)
    }
  }, [])

  const fetchPlaces = useCallback(async (poly: GeoJSONPolygon, intent: string, exclude: string[]) => {
    setIsLoadingPlaces(true)
    try {
      const res = await fetch('/api/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          polygon: poly,
          category: intent || undefined,
          excludeIds: exclude.length ? exclude : undefined,
        }),
      })
      setRawPlaces(await res.json())
    } catch (err) {
      console.error('[places]', err)
    } finally {
      setIsLoadingPlaces(false)
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

  // Re-fetch places when the polygon, intent text, or exclusion list changes
  useEffect(() => {
    if (!polygon) return
    fetchPlaces(polygon, debouncedIntentText, excludeIds)
  }, [polygon, debouncedIntentText, excludeIds, fetchPlaces])

  // A new polygon, intent, mode, or open-only filter invalidates the current
  // selection and pagination — reset during render (not an effect) per React's
  // "adjusting state when a prop changes" pattern.
  const [resetKey, setResetKey] = useState({ polygon, intent: debouncedIntentText, mode: intentMode, openOnly })
  if (
    polygon !== resetKey.polygon ||
    debouncedIntentText !== resetKey.intent ||
    intentMode !== resetKey.mode ||
    openOnly !== resetKey.openOnly
  ) {
    setResetKey({ polygon, intent: debouncedIntentText, mode: intentMode, openOnly })
    setSelectedPlaceId(null)
    setVisibleCount(intentMode === 0 ? 5 : 3)
    setWildSeed(0)
  }

  const isFirstRun = origin === null
  const isLoading = isLoadingIsochrone || isLoadingPlaces

  const enriched = useMemo(() => rawPlaces.map((p) => enrichPlace(p, intentMode)), [rawPlaces, intentMode])

  const filtered = useMemo(() => (openOnly ? enriched.filter((p) => p.isOpenNow) : enriched), [enriched, openOnly])

  const ranked = useMemo(() => {
    if (!origin) return filtered
    return [...filtered].sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating
      return (
        haversineKm(origin.lat, origin.lng, a.lat, a.lng) - haversineKm(origin.lat, origin.lng, b.lat, b.lng)
      )
    })
  }, [filtered, origin])

  const wildPicks = useMemo(() => seededShuffle(filtered, wildSeed + 1).slice(0, 3), [filtered, wildSeed])

  const listCandidates = intentMode === 2 ? wildPicks : ranked
  const totalCount = filtered.length

  const selectedPlace = selectedPlaceId ? (filtered.find((p) => p.place_id === selectedPlaceId) ?? null) : null
  const isEmpty = !isLoading && polygon !== null && totalCount === 0
  const isDetail = selectedPlace !== null

  const screen: 'firstrun' | 'loading' | 'detail' | 'empty' | 'search' = isFirstRun
    ? 'firstrun'
    : isLoading
      ? 'loading'
      : isDetail
        ? 'detail'
        : isEmpty
          ? 'empty'
          : 'search'

  const theme = useMemo(() => getInkTheme(intentMode), [intentMode])

  const visiblePlaces = useMemo(
    () => (intentMode === 2 ? wildPicks : ranked.slice(0, visibleCount)).map((p, i) => ({ ...p, idx: i })),
    [intentMode, wildPicks, ranked, visibleCount]
  )

  const blobOpacity = isLoading ? 0.06 : [0.18, 0.15, 0.13][intentMode]

  const areaLabel = useMemo(() => {
    if (!polygon) return ''
    const area = polygonAreaKm2(polygon)
    return `${area.toFixed(1)} km² reachable · ${totalCount} place${totalCount !== 1 ? 's' : ''} inside`
  }, [polygon, totalCount])

  const selectedTravelInfo = useMemo(() => {
    if (!selectedPlace || !origin) return null
    const distKm = haversineKm(origin.lat, origin.lng, selectedPlace.lat, selectedPlace.lng)
    const minutes = estimateTravelMinutes(distKm, travelMode)
    return { dist: `${Math.max(1, Math.round(minutes))} min`, slack: Math.round(timeBudget - minutes) }
  }, [selectedPlace, origin, travelMode, timeBudget])

  const handleShowAll = useCallback(() => setVisibleCount(9999), [])
  const handleReroll = useCallback(() => setWildSeed((s) => s + 1), [])
  const handleStretchTime = useCallback(() => setTimeBudget((v) => Math.min(v + 15, 90)), [])
  const handleSwitchMode = useCallback(() => {
    setTravelMode((m) => TRAVEL_CYCLE[(TRAVEL_CYCLE.indexOf(m) + 1) % TRAVEL_CYCLE.length])
  }, [])
  const handleShowClosedToo = useCallback(() => setOpenOnly(false), [])
  const handleToggleOpenOnly = useCallback(() => setOpenOnly((v) => !v), [])
  const handleNotForMe = useCallback((placeId: string) => {
    setExcludeIds((prev) => (prev.includes(placeId) ? prev : [...prev, placeId]))
    setSelectedPlaceId(null)
  }, [])

  return (
    <MapProvider>
      <div className="flex h-full" style={{ background: theme.shell }}>
        <aside
          className="w-[412px] flex-shrink-0 flex flex-col overflow-hidden border-r"
          style={{ background: theme.panel, borderColor: theme.line }}
        >
          <IntentPanel
            theme={theme}
            intentMode={intentMode}
            intentText={intentText}
            timeBudget={timeBudget}
            travelMode={travelMode}
            isFirstRun={isFirstRun}
            onIntentModeChange={setIntentMode}
            onIntentTextChange={handleIntentTextChange}
            onTimeBudgetChange={setTimeBudget}
            onTravelModeChange={setTravelMode}
          />

          {screen === 'firstrun' && <FirstRunHint theme={theme} />}
          {screen === 'loading' && <LoadingSkeleton theme={theme} />}
          {screen === 'empty' && (
            <EmptyState
              theme={theme}
              intentText={debouncedIntentText}
              timeBudget={timeBudget}
              travelMode={travelMode}
              openOnly={openOnly}
              onStretchTime={handleStretchTime}
              onSwitchMode={handleSwitchMode}
              onShowClosed={handleShowClosedToo}
            />
          )}
          {screen === 'detail' && selectedPlace && origin && selectedTravelInfo && (
            <DetailPanel
              theme={theme}
              place={selectedPlace}
              origin={origin}
              travelMode={travelMode}
              dist={selectedTravelInfo.dist}
              slackMinutes={selectedTravelInfo.slack}
              onBack={() => setSelectedPlaceId(null)}
              onNotForMe={() => handleNotForMe(selectedPlace.place_id)}
            />
          )}
          {screen === 'search' && origin && (
            <ResultsList
              places={listCandidates}
              visibleCount={visibleCount}
              totalCount={totalCount}
              mode={intentMode}
              origin={origin}
              travelMode={travelMode}
              selectedPlaceId={selectedPlaceId}
              theme={theme}
              onPlaceSelect={setSelectedPlaceId}
              onShowAll={handleShowAll}
              onReroll={handleReroll}
            />
          )}

          <div
            className="mt-auto px-6 py-2.5 border-t flex justify-between flex-none"
            style={{ borderColor: theme.line }}
          >
            <span className="font-mono text-[8.5px] tracking-wide uppercase" style={{ color: theme.faint }}>
              Ratings · mock, pending live Google
            </span>
            <span className="font-mono text-[8.5px] tracking-wide uppercase" style={{ color: theme.faint }}>
              Places · Foursquare OS
            </span>
          </div>
        </aside>

        <main className="flex-1 relative">
          <MapCanvas
            polygon={polygon}
            places={visiblePlaces}
            selectedPlaceId={selectedPlaceId}
            onOriginSet={handleOriginSet}
            onPlaceSelect={setSelectedPlaceId}
            theme={theme}
            isFirstRun={isFirstRun}
            blobOpacity={blobOpacity}
            timeBudget={timeBudget}
            travelMode={travelMode}
            areaLabel={areaLabel}
            openOnly={openOnly}
            onToggleOpenOnly={handleToggleOpenOnly}
          />
        </main>
      </div>
    </MapProvider>
  )
}
