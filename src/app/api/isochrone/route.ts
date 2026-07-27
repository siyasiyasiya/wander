import { NextRequest, NextResponse } from 'next/server'
import { createIsochroneProvider } from '@/lib/isochrone/client'
import type { IsochroneParams } from '@/lib/isochrone/types'

export async function POST(req: NextRequest) {
  const body: IsochroneParams = await req.json()

  try {
    const provider = createIsochroneProvider()
    const polygon = await provider.fetchIsochrone(body)
    return NextResponse.json(polygon)
  } catch (err) {
    console.error('[isochrone]', err)
    return NextResponse.json(
      { error: 'Failed to fetch isochrone' },
      { status: 500 }
    )
  }
}
