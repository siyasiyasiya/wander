import { NextRequest, NextResponse } from 'next/server'
import { queryPlacesInPolygon } from '@/lib/places/poiQuery'
import type { GeoJSONPolygon } from '@/lib/isochrone/types'

export async function POST(req: NextRequest) {
  const { polygon, category, excludeIds }: {
    polygon: GeoJSONPolygon
    category?: string
    excludeIds?: string[]
  } = await req.json()

  try {
    const places = await queryPlacesInPolygon(polygon, category, excludeIds)
    return NextResponse.json(places)
  } catch (err) {
    console.error('[places]', err)
    // Return empty array when DB is not configured — UI shows "Nothing found"
    return NextResponse.json([])
  }
}
