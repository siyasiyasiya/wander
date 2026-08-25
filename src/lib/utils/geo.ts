import type { GeoJSONPolygon } from '@/lib/isochrone/types'

// Ray casting against the isochrone's outer ring — true containment, not a
// bounding-circle approximation, so results are only "in the time limit" if
// they fall inside the actual reachable shape (which is rarely circular).
export function pointInPolygon(lat: number, lng: number, polygon: GeoJSONPolygon): boolean {
  const ring = polygon.geometry.coordinates[0] // [lng, lat][]
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    const intersect = (yi > lat) !== (yj > lat) &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

// Equirectangular projection is fine at isochrone scale (a few km across).
export function polygonAreaKm2(polygon: GeoJSONPolygon): number {
  const ring = polygon.geometry.coordinates[0]
  if (!ring || ring.length < 3) return 0

  const originLat = ring[0][1]
  const kmPerDegLat = 110.574
  const kmPerDegLng = 111.32 * Math.cos((originLat * Math.PI) / 180)

  const pts = ring.map(([lng, lat]) => [lng * kmPerDegLng, lat * kmPerDegLat])

  let area = 0
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i]
    const [x2, y2] = pts[i + 1]
    area += x1 * y2 - x2 * y1
  }
  return Math.abs(area) / 2
}
