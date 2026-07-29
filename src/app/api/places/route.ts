// force-dynamic is mandatory — Google ToS prohibits caching ratings
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { queryPlacesGoogle } from '@/lib/places/googlePlacesQuery'
import type { GeoJSONPolygon } from '@/lib/isochrone/types'

export async function POST(req: NextRequest) {
  const { polygon, category }: { polygon: GeoJSONPolygon; category?: string } = await req.json()

  try {
    const places = await queryPlacesGoogle(polygon, category, process.env.GOOGLE_PLACES_API_KEY)
    return NextResponse.json(places)
  } catch (err) {
    console.error('[places]', err)
    return NextResponse.json([])
  }
}
