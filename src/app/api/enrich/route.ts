// force-dynamic is mandatory — Google ToS prohibits caching ratings
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { enrichPlaces } from '@/lib/places/enrich'
import type { GeoJSONPolygon } from '@/lib/isochrone/types'
import type { PlaceBase } from '@/lib/places/types'

interface EnrichRequest {
  places: PlaceBase[]
  polygon: GeoJSONPolygon
  category?: string
}

export async function POST(req: Request) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    return NextResponse.json([], { status: 200 })
  }

  const { places, polygon, category }: EnrichRequest = await req.json()

  try {
    const enriched = await enrichPlaces(places, polygon, category ?? '', apiKey)
    return NextResponse.json(enriched)
  } catch (err) {
    console.error('[enrich]', err)
    return NextResponse.json([], { status: 200 })
  }
}
