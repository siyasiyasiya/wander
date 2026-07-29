// force-dynamic is mandatory on any route using this — Google ToS prohibits caching ratings
import type { GeoJSONPolygon } from '@/lib/isochrone/types'
import type { PlaceEnriched } from '@/lib/places/types'
import { haversineKm } from '@/lib/utils/distance'
import { computeUtilityScore } from '@/lib/ranking/utility'

const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.location',
  'places.types',
  'places.rating',
  'places.userRatingCount',
  'places.currentOpeningHours.openNow',
  'places.googleMapsUri',
].join(',')

interface GooglePlace {
  id: string
  displayName?: { text: string }
  location?: { latitude: number; longitude: number }
  types?: string[]
  rating?: number
  userRatingCount?: number
  currentOpeningHours?: { openNow?: boolean }
  googleMapsUri?: string
}

function polygonCenter(polygon: GeoJSONPolygon): { lat: number; lng: number; radiusMeters: number } {
  const coords = polygon.geometry.coordinates[0] // [lng, lat][]
  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity
  for (const [lng, lat] of coords) {
    if (lat < minLat) minLat = lat
    if (lat > maxLat) maxLat = lat
    if (lng < minLng) minLng = lng
    if (lng > maxLng) maxLng = lng
  }
  const lat = (minLat + maxLat) / 2
  const lng = (minLng + maxLng) / 2
  const radiusMeters = Math.max(
    ...coords.map(([cLng, cLat]) => haversineKm(lat, lng, cLat, cLng) * 1000),
    500,
  )
  return { lat, lng, radiusMeters }
}

export async function queryPlacesGoogle(
  polygon: GeoJSONPolygon,
  category?: string,
  apiKey?: string,
): Promise<PlaceEnriched[]> {
  if (!apiKey) return []

  const { lat, lng, radiusMeters } = polygonCenter(polygon)

  let body: Record<string, unknown>
  let endpoint: string

  if (category) {
    endpoint = 'https://places.googleapis.com/v1/places:searchText'
    body = {
      textQuery: category,
      locationRestriction: {
        circle: { center: { latitude: lat, longitude: lng }, radius: radiusMeters },
      },
      maxResultCount: 20,
      languageCode: 'en',
    }
  } else {
    endpoint = 'https://places.googleapis.com/v1/places:searchNearby'
    body = {
      locationRestriction: {
        circle: { center: { latitude: lat, longitude: lng }, radius: radiusMeters },
      },
      maxResultCount: 20,
      rankPreference: 'POPULARITY',
      languageCode: 'en',
    }
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    console.error('[googlePlaces]', res.status, await res.text())
    return []
  }

  const data = await res.json()
  const googlePlaces: GooglePlace[] = data.places ?? []

  const distances = googlePlaces
    .filter((p) => p.location)
    .map((p) => haversineKm(lat, lng, p.location!.latitude, p.location!.longitude))
  const maxDistanceKm = Math.max(...distances, 0.001)

  return googlePlaces
    .filter((p) => p.location && p.displayName)
    .map((p, i) => {
      const distKm = distances[i] ?? 0
      return {
        place_id: p.id,
        name: p.displayName!.text,
        lat: p.location!.latitude,
        lng: p.location!.longitude,
        categories: (p.types ?? []).slice(0, 3),
        rating: p.rating,
        userRatingCount: p.userRatingCount,
        openNow: p.currentOpeningHours?.openNow,
        googleMapsUri: p.googleMapsUri,
        utilityScore: computeUtilityScore({
          rating: p.rating,
          userRatingCount: p.userRatingCount,
          distanceKm: distKm,
          maxDistanceKm,
        }),
      }
    })
    .sort((a, b) => b.utilityScore - a.utilityScore)
}
