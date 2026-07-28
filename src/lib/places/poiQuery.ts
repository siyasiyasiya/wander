import { getDb } from '@/lib/db'
import type { GeoJSONPolygon } from '@/lib/isochrone/types'
import type { PlaceBase } from './types'

export async function queryPlacesInPolygon(
  polygon: GeoJSONPolygon,
  category?: string,
  excludeIds?: string[]
): Promise<PlaceBase[]> {
  const db = getDb()
  const polygonJson = JSON.stringify(polygon.geometry)
  const excluded = excludeIds && excludeIds.length > 0 ? excludeIds : null

  const { rows } = await db.query<PlaceBase>(
    `SELECT place_id, name, lat, lng, categories
     FROM places
     WHERE ST_Within(geom, ST_GeomFromGeoJSON($1))
       AND ($2::text IS NULL OR $2 = ANY(categories))
       AND ($3::text[] IS NULL OR place_id != ALL($3))
     LIMIT 200`,
    [polygonJson, category ?? null, excluded]
  )

  return rows
}
