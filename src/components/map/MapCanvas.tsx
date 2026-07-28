'use client'

import { useEffect, useRef } from 'react'
import { useMapLoader } from '@/components/providers/MapProvider'
import type { GeoJSONPolygon } from '@/lib/isochrone/types'
import type { PlaceBase } from '@/lib/places/types'

interface MapCanvasProps {
  polygon: GeoJSONPolygon | null
  places: PlaceBase[]
  selectedPlaceId: string | null
  onOriginSet: (lat: number, lng: number) => void
  onPlaceSelect: (placeId: string) => void
}

const DEFAULT_CENTER = { lat: 40.7128, lng: -74.006 }

export function MapCanvas({
  polygon,
  places,
  selectedPlaceId,
  onOriginSet,
  onPlaceSelect,
}: MapCanvasProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const originMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null)
  const polygonRef = useRef<google.maps.Polygon | null>(null)
  const placeMarkersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map())
  const onOriginSetRef = useRef(onOriginSet)
  const onPlaceSelectRef = useRef(onPlaceSelect)
  const { isLoaded, loadError } = useMapLoader()

  useEffect(() => { onOriginSetRef.current = onOriginSet }, [onOriginSet])
  useEffect(() => { onPlaceSelectRef.current = onPlaceSelect }, [onPlaceSelect])

  // Initialize map once
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return

    async function init(center: google.maps.LatLngLiteral) {
      const { AdvancedMarkerElement } = (await google.maps.importLibrary(
        'marker'
      )) as google.maps.MarkerLibrary

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
          originMarkerRef.current = new AdvancedMarkerElement({
            map,
            position: { lat, lng },
            zIndex: 100,
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
      strokeColor: '#4F46E5',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#4F46E5',
      fillOpacity: 0.15,
      map,
    })
  }, [polygon])

  // Render / update place pins
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    async function renderPins() {
      const { AdvancedMarkerElement, PinElement } = (await google.maps.importLibrary(
        'marker'
      )) as google.maps.MarkerLibrary

      const incoming = new Set(places.map((p) => p.place_id))

      // Remove stale markers
      placeMarkersRef.current.forEach((marker, id) => {
        if (!incoming.has(id)) {
          marker.map = null
          placeMarkersRef.current.delete(id)
        }
      })

      // Add new markers
      for (const place of places) {
        if (placeMarkersRef.current.has(place.place_id)) continue

        const pin = new PinElement({
          background: '#4F46E5',
          borderColor: '#3730A3',
          glyphColor: '#fff',
          scale: 0.85,
        })

        const marker = new AdvancedMarkerElement({
          map,
          position: { lat: place.lat, lng: place.lng },
          title: place.name,
          content: pin.element,
        })

        marker.addListener('click', () => onPlaceSelectRef.current(place.place_id))
        placeMarkersRef.current.set(place.place_id, marker)
      }
    }

    renderPins()
  }, [places])

  // Highlight selected pin
  useEffect(() => {
    placeMarkersRef.current.forEach((marker, id) => {
      marker.zIndex = id === selectedPlaceId ? 99 : 1
    })
  }, [selectedPlaceId])

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-50">
        <p className="text-sm text-zinc-500">Failed to load map: {loadError.message}</p>
      </div>
    )
  }

  return <div ref={mapRef} className="w-full h-full" />
}
