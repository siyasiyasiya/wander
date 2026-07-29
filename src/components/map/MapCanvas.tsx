'use client'

import { useEffect, useRef } from 'react'
import { useMapLoader } from '@/components/providers/MapProvider'
import type { GeoJSONPolygon, TravelMode } from '@/lib/isochrone/types'
import type { EnrichedPlace } from '@/lib/places/mockEnrich'
import type { InkTheme } from '@/lib/theme'

interface VisiblePlace extends EnrichedPlace {
  idx: number
}

interface MapCanvasProps {
  polygon: GeoJSONPolygon | null
  places: VisiblePlace[]
  selectedPlaceId: string | null
  onOriginSet: (lat: number, lng: number) => void
  onPlaceSelect: (placeId: string) => void
  theme: InkTheme
  isFirstRun: boolean
  blobOpacity: number
  timeBudget: number
  travelMode: TravelMode
  areaLabel: string
  openOnly: boolean
  onToggleOpenOnly: () => void
}

const DEFAULT_CENTER = { lat: 40.7128, lng: -74.006 }

export function MapCanvas({
  polygon,
  places,
  selectedPlaceId,
  onOriginSet,
  onPlaceSelect,
  theme: t,
  isFirstRun,
  blobOpacity,
  timeBudget,
  travelMode,
  areaLabel,
  openOnly,
  onToggleOpenOnly,
}: MapCanvasProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const originMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null)
  const originDotRef = useRef<HTMLDivElement | null>(null)
  const polygonRef = useRef<google.maps.Polygon | null>(null)
  const placeMarkersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map())
  const onOriginSetRef = useRef(onOriginSet)
  const onPlaceSelectRef = useRef(onPlaceSelect)
  const { isLoaded, loadError } = useMapLoader()

  useEffect(() => {
    onOriginSetRef.current = onOriginSet
  }, [onOriginSet])
  useEffect(() => {
    onPlaceSelectRef.current = onPlaceSelect
  }, [onPlaceSelect])

  // Initialize map once
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return

    async function init(center: google.maps.LatLngLiteral) {
      const { AdvancedMarkerElement } = (await google.maps.importLibrary('marker')) as google.maps.MarkerLibrary

      const map = new google.maps.Map(mapRef.current!, {
        center,
        zoom: 14,
        mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID',
        gestureHandling: 'greedy',
      })

      map.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return
        const lat = e.latLng.lat()
        const lng = e.latLng.lng()

        if (originMarkerRef.current) {
          originMarkerRef.current.position = { lat, lng }
        } else {
          const dot = document.createElement('div')
          dot.style.width = '14px'
          dot.style.height = '14px'
          dot.style.borderRadius = '999px'
          originDotRef.current = dot
          originMarkerRef.current = new AdvancedMarkerElement({
            map,
            position: { lat, lng },
            zIndex: 100,
            content: dot,
          })
        }

        onOriginSetRef.current(lat, lng)
      })

      mapInstanceRef.current = map
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => init({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => init(DEFAULT_CENTER)
      )
    } else {
      init(DEFAULT_CENTER)
    }
  }, [isLoaded])

  // Keep the origin dot themed to the current ink mode
  useEffect(() => {
    const dot = originDotRef.current
    if (!dot) return
    dot.style.background = t.ink
    dot.style.boxShadow = `0 0 0 4px ${t.panel}`
  }, [t])

  // Draw / update the isochrone polygon
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    if (polygonRef.current) {
      polygonRef.current.setMap(null)
      polygonRef.current = null
    }

    if (!polygon) return

    const paths = polygon.geometry.coordinates[0].map(([lng, lat]) => ({ lat, lng }))
    polygonRef.current = new google.maps.Polygon({
      paths,
      strokeColor: t.accent,
      strokeOpacity: 0.8,
      strokeWeight: 2.5,
      fillColor: t.accent,
      fillOpacity: blobOpacity,
      map,
    })
  }, [polygon, t.accent, blobOpacity])

  // Render numbered place pins — mirrors exactly what's ranked/dealt in the list
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    async function renderPins() {
      const { AdvancedMarkerElement } = (await google.maps.importLibrary('marker')) as google.maps.MarkerLibrary

      placeMarkersRef.current.forEach((marker) => {
        marker.map = null
      })
      placeMarkersRef.current.clear()

      for (const place of places) {
        const isSelected = place.place_id === selectedPlaceId
        const pillBg = isSelected ? t.ink : t.chip

        const bubble = document.createElement('div')
        bubble.style.display = 'flex'
        bubble.style.flexDirection = 'column'
        bubble.style.alignItems = 'center'
        bubble.style.cursor = 'pointer'

        const pill = document.createElement('div')
        pill.style.display = 'flex'
        pill.style.alignItems = 'center'
        pill.style.gap = '6px'
        pill.style.padding = '5px 10px 5px 6px'
        pill.style.borderRadius = '999px'
        pill.style.boxShadow = '0 2px 10px rgba(20,32,15,.22)'
        pill.style.whiteSpace = 'nowrap'
        pill.style.background = pillBg
        pill.style.color = isSelected ? t.onAccent : t.ink

        const dot = document.createElement('span')
        dot.style.width = '17px'
        dot.style.height = '17px'
        dot.style.borderRadius = '999px'
        dot.style.fontFamily = 'var(--font-geist-mono), monospace'
        dot.style.fontSize = '9px'
        dot.style.display = 'flex'
        dot.style.alignItems = 'center'
        dot.style.justifyContent = 'center'
        dot.style.background = isSelected ? 'rgba(255,255,255,.25)' : t.ink
        dot.style.color = t.onAccent
        dot.textContent = String(place.idx + 1).padStart(2, '0')

        const label = document.createElement('span')
        label.style.fontSize = '11px'
        label.style.fontWeight = '600'
        label.style.letterSpacing = '-0.01em'
        label.textContent = place.name

        const stem = document.createElement('span')
        stem.style.width = '1px'
        stem.style.height = '10px'
        stem.style.background = pillBg

        pill.appendChild(dot)
        pill.appendChild(label)
        bubble.appendChild(pill)
        bubble.appendChild(stem)

        const marker = new AdvancedMarkerElement({
          map,
          position: { lat: place.lat, lng: place.lng },
          content: bubble,
          zIndex: isSelected ? 99 : 1,
        })
        marker.addListener('click', () => onPlaceSelectRef.current(place.place_id))
        placeMarkersRef.current.set(place.place_id, marker)
      }
    }

    renderPins()
  }, [places, selectedPlaceId, t])

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-50">
        <p className="text-sm text-zinc-500">Failed to load map: {loadError.message}</p>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />

      {isFirstRun && (
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-5 py-3 rounded-full text-[13px] font-medium pointer-events-none"
          style={{ background: t.chip, border: `1px solid ${t.border}`, color: t.ink }}
        >
          Click anywhere to drop your start point
        </div>
      )}

      {!isFirstRun && polygon && (
        <div
          className="absolute left-4 bottom-4 px-3.5 py-2.5 rounded-[10px] flex flex-col gap-0.5"
          style={{ background: t.chip, border: `1px solid ${t.line}` }}
        >
          <span className="font-mono text-[10px] tracking-wide uppercase" style={{ color: t.accentText }}>
            {timeBudget} min by {travelMode}
          </span>
          <span className="text-[10.5px]" style={{ color: t.muted }}>
            {areaLabel}
          </span>
        </div>
      )}

      {!isFirstRun && (
        <div className="absolute top-4 right-4 flex gap-1.5">
          <span
            onClick={onToggleOpenOnly}
            className="px-3 py-2 rounded-[9px] font-mono text-[10px] tracking-wide uppercase cursor-pointer"
            style={{
              background: openOnly ? t.ink : t.chip,
              color: openOnly ? t.onAccent : t.ink,
              border: `1px solid ${t.line}`,
            }}
          >
            Open now
          </span>
        </div>
      )}

      <span className="absolute right-3.5 bottom-3.5 text-[9.5px]" style={{ color: t.faint }}>
        Map data © Google
      </span>
    </div>
  )
}
