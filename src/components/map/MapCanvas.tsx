'use client'

import { useEffect, useRef } from 'react'
import { useMapLoader } from '@/components/providers/MapProvider'
import type { GeoJSONPolygon } from '@/lib/isochrone/types'

interface MapCanvasProps {
  polygon: GeoJSONPolygon | null
  onOriginSet: (lat: number, lng: number) => void
}

const DEFAULT_CENTER = { lat: 40.7128, lng: -74.006 } // NYC fallback

export function MapCanvas({ polygon, onOriginSet }: MapCanvasProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null)
  const polygonRef = useRef<google.maps.Polygon | null>(null)
  // Stable ref so the click listener always calls the latest callback
  const onOriginSetRef = useRef(onOriginSet)
  const { isLoaded, loadError } = useMapLoader()

  useEffect(() => {
    onOriginSetRef.current = onOriginSet
  }, [onOriginSet])

  // Initialize map once Maps JS API is loaded
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

        if (markerRef.current) {
          markerRef.current.position = { lat, lng }
        } else {
          markerRef.current = new AdvancedMarkerElement({ map, position: { lat, lng } })
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

    // GeoJSON coordinates are [lng, lat]; Google Maps expects { lat, lng }
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

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-50">
        <p className="text-sm text-zinc-500">Failed to load map: {loadError.message}</p>
      </div>
    )
  }

  return <div ref={mapRef} className="w-full h-full" />
}
