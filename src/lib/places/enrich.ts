import type { GeoJSONPolygon } from '@/lib/isochrone/types'
import type { PlaceBase, PlaceEnriched } from '@/lib/places/types'
import { haversineKm } from '@/lib/utils/distance'
import { computeUtilityScore } from '@/lib/ranking/utility'

const PROXIMITY_THRESHOLD_KM = 0.08 // 80 m

interface GooglePlace {
  id: string
  displayName?: { text: string }
  location?: { latitude: number; longitude: number }
  rating?: number
  userRatingCount?: number
  currentOpeningHours?: { openNow?: boolean }
  googleMapsUri?: string
}

function boundingBox(polygon: GeoJSONPolygon) {
  const coords = polygon.geometry.coordinates[0] // [lng, lat][]
  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity
  for (const [lng, lat] of coords) {
    if (lat < minLat) minLat = lat
    if (lat > maxLat) maxLat = lat
    if (lng < minLng) minLng = lng
    if (lng > maxLng) maxLng = lng
  }
  return { minLat, maxLat, minLng, maxLng }
}

export async function enrichPlaces(
  places: PlaceBase[],
  polygon: GeoJSONPolygon,
  category: string,
  apiKey: string,
): Promise<PlaceEnriched[]> {
  if (places.length === 0) return []

  const { minLat, maxLat, minLng, maxLng } = boundingBox(polygon)

  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': [
        'places.id',
        'places.displayName',
        'places.location',
        'places.rating',
        'places.userRatingCount',
        'places.currentOpeningHours.openNow',
        'places.googleMapsUri',
      ].join(','),
    },
    body: JSON.stringify({
      textQuery: category || 'place',
      locationRestriction: {
        rectangle: {
          low: { latitude: minLat, longitude: minLng },
          high: { latitude: maxLat, longitude: maxLng },
        },
      },
      maxResultCount: 20,
      languageCode: 'en',
    }),
  })

  if (!res.ok) {
    console.error('[enrich] Google Places error', res.status, await res.text())
    return places.map((p) => ({ ...p, utilityScore: 0 }))
  }

  const data = await res.json()
  const googlePlaces: GooglePlace[] = data.places ?? []

  // Build lookup: PostGIS place → best-matching Google result by proximity
  const enrichmentMap = new Map<string, GooglePlace>()
  for (const gp of googlePlaces) {
    if (!gp.location) continue
    for (const place of places) {
      const dist = haversineKm(place.lat, place.lng, gp.location.latitude, gp.location.longitude)
      if (dist <= PROXIMITY_THRESHOLD_KM) {
        const existing = enrichmentMap.get(place.place_id)
        if (!existing) enrichmentMap.set(place.place_id, gp)
      }
    }
  }

  // Compute max distance for relative proximity scoring
  const distances = places.map((p) => haversineKm(
    (minLat + maxLat) / 2,
    (minLng + maxLng) / 2,
    p.lat,
    p.lng,
  ))
  const maxDistanceKm = Math.max(...distances, 0.001)

  const enriched: PlaceEnriched[] = places.map((place, i) => {
    const gp = enrichmentMap.get(place.place_id)
    return {
      ...place,
      rating: gp?.rating,
      userRatingCount: gp?.userRatingCount,
      openNow: gp?.currentOpeningHours?.openNow,
      googleMapsUri: gp?.googleMapsUri,
      utilityScore: computeUtilityScore({
        rating: gp?.rating,
        userRatingCount: gp?.userRatingCount,
        distanceKm: distances[i],
        maxDistanceKm,
      }),
    }
  })

  return enriched.sort((a, b) => b.utilityScore - a.utilityScore)
}
