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
import { computeUtilityScore } from '@/lib/ranking/utility'
import { pickOverlooked } from '@/lib/ranking/overlooked'
import type { GeoJSONPolygon, TravelMode } from '@/lib/isochrone/types'
import type { PlaceBase, PlaceEnriched } from '@/lib/places/types'
import type { RankedPlace } from '@/lib/ranking/types'
import type { NarrateResult } from '@/lib/intent/narrate'

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
  const [googleDataMap, setGoogleDataMap] = useState<Map<string, PlaceEnriched>>(new Map())
  const [excludeIds, setExcludeIds] = useState<string[]>([])
  const [openOnly, setOpenOnly] = useState(false)
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(5)
  const [wildSeed, setWildSeed] = useState(0)
  const [isLoadingIsochrone, setIsLoadingIsochrone] = useState(false)
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false)
  const [classifiedCategory, setClassifiedCategory] = useState('')
  const [narrateMap, setNarrateMap] = useState<Map<string, NarrateResult>>(new Map())
  const [realRouteMap, setRealRouteMap] = useState<Map<string, { seconds: number; meters: number }>>(new Map())

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

  const fetchPlaces = useCallback(async (poly: GeoJSONPolygon, intent: string, _exclude: string[]) => {
    setIsLoadingPlaces(true)
    setGoogleDataMap(new Map())
    try {
      const res = await fetch('/api/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ polygon: poly, category: intent || undefined }),
      })
      const places: PlaceEnriched[] = await res.json()
      setRawPlaces(places)
      // Places already come back with live Google ratings — no separate enrich step needed
      setGoogleDataMap(new Map(places.map((p) => [p.place_id, p])))
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

  // Re-fetch places when the polygon, intent text, or exclusion list changes.
  // If text is present, classify intent first (sets mode + extracts clean category).
  useEffect(() => {
    if (!polygon) return

    const poly = polygon

    async function run() {
      let mode: IntentMode = intentMode
      let category = debouncedIntentText

      if (debouncedIntentText.trim()) {
        try {
          const res = await fetch('/api/intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: debouncedIntentText }),
          })
          const classified: { mode: IntentMode; category: string } = await res.json()
          mode = classified.mode
          category = classified.category
          setIntentMode(mode)
          setClassifiedCategory(category)
        } catch {
          // fallback: use raw text as category, keep current mode
        }
      }

      fetchPlaces(poly, category, excludeIds)
    }

    run()
    // intentMode is intentionally excluded — manual toggle clicks don't re-trigger classification
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [polygon, debouncedIntentText, excludeIds, fetchPlaces])

  // Fire narration after each new places result — generates real per-place copy
  useEffect(() => {
    if (rawPlaces.length === 0) return
    const visible = rawPlaces.slice(0, 5).map((p) => ({
      place_id: p.place_id,
      name: p.name,
      categories: p.categories,
    }))
    fetch('/api/narrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ places: visible, mode: intentMode }),
    })
      .then((r) => r.json())
      .then((data: Record<string, NarrateResult>) => setNarrateMap(new Map(Object.entries(data))))
      .catch(() => {})
    // intentMode intentionally excluded — copy regenerates on new places, not every toggle click
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawPlaces])

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

  const enriched = useMemo((): RankedPlace[] => {
    const pool = rawPlaces.filter((p) => !excludeIds.includes(p.place_id))
    const maxDistanceKm = origin
      ? Math.max(...pool.map((p) => haversineKm(origin.lat, origin.lng, p.lat, p.lng)), 0.001)
      : 0.001

    return pool.map((p) => {
      const mock = enrichPlace(p, intentMode)
      const gd = googleDataMap.get(p.place_id)
      const narrated = narrateMap.get(p.place_id)
      const base = !gd ? mock : (() => {
        const reviewsLabel = gd.userRatingCount != null ? `${gd.userRatingCount.toLocaleString()} reviews` : mock.reviewsLabel
        const openLabel = gd.openNow != null ? (gd.openNow ? 'Open now' : 'Closed now') : mock.openLabel
        return {
          ...mock,
          rating: gd.rating ?? mock.rating,
          reviews: gd.userRatingCount ?? mock.reviews,
          reviewsLabel,
          openLabel,
          isOpenNow: gd.openNow ?? mock.isOpenNow,
          hoursToday: gd.hoursToday ?? mock.hoursToday,
          src: 'Google',
          googleMapsUri: gd.googleMapsUri,
          isLiveData: true as const,
        }
      })()

      const distanceKm = origin ? haversineKm(origin.lat, origin.lng, p.lat, p.lng) : 0
      const utilityScore = computeUtilityScore({
        rating: base.rating,
        userRatingCount: base.reviews,
        distanceKm,
        maxDistanceKm,
      })

      return {
        ...base,
        utilityScore,
        quote: narrated?.quote ?? base.quote,
        why: narrated?.why ?? base.why,
        tag: narrated?.tag ?? base.tag,
      }
    })
  }, [rawPlaces, intentMode, googleDataMap, excludeIds, narrateMap, origin])

  const filtered = useMemo(() => (openOnly ? enriched.filter((p) => p.isOpenNow) : enriched), [enriched, openOnly])

  const ranked = useMemo(() => {
    if (!origin) return filtered
    return [...filtered].sort((a, b) => b.utilityScore - a.utilityScore)
  }, [filtered, origin])

  const wildPicks = useMemo(() => pickOverlooked(filtered, wildSeed + 1, 3), [filtered, wildSeed])

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
  const hasLiveData = googleDataMap.size > 0

  const areaLabel = useMemo(() => {
    if (!polygon) return ''
    const area = polygonAreaKm2(polygon)
    return `${area.toFixed(1)} km² reachable · ${totalCount} place${totalCount !== 1 ? 's' : ''} inside`
  }, [polygon, totalCount])

  // Real routed duration for the selected place — falls back to the flat-speed
  // estimate below until it resolves (or if it fails), so no loading state needed.
  useEffect(() => {
    if (!selectedPlace || !origin) return
    const key = `${selectedPlace.place_id}:${travelMode}`
    if (realRouteMap.has(key)) return

    fetch('/api/directions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        originLat: origin.lat,
        originLng: origin.lng,
        destLat: selectedPlace.lat,
        destLng: selectedPlace.lng,
        mode: travelMode,
      }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((route: { seconds: number; meters: number }) => {
        setRealRouteMap((prev) => new Map(prev).set(key, route))
      })
      .catch(() => {})
  }, [selectedPlace, origin, travelMode, realRouteMap])

  const selectedTravelInfo = useMemo(() => {
    if (!selectedPlace || !origin) return null
    const real = realRouteMap.get(`${selectedPlace.place_id}:${travelMode}`)
    const minutes = real
      ? real.seconds / 60
      : estimateTravelMinutes(haversineKm(origin.lat, origin.lng, selectedPlace.lat, selectedPlace.lng), travelMode)
    return { dist: `${Math.max(1, Math.round(minutes))} min`, slack: Math.round(timeBudget - minutes) }
  }, [selectedPlace, origin, travelMode, timeBudget, realRouteMap])

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
              {hasLiveData ? 'Ratings · Google' : 'Ratings · mock'}
            </span>
            <span className="font-mono text-[8.5px] tracking-wide uppercase" style={{ color: theme.faint }}>
              Places · Google
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
            isLoadingIsochrone={isLoadingIsochrone}
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
