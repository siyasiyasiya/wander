import { NextRequest, NextResponse } from 'next/server'
import { createRoutingProvider } from '@/lib/routing/client'
import type { RouteParams } from '@/lib/routing/types'

export async function POST(req: NextRequest) {
  const body: RouteParams = await req.json()

  try {
    const provider = createRoutingProvider()
    const route = await provider.fetchRoute(body)
    return NextResponse.json(route)
  } catch (err) {
    console.error('[directions]', err)
    return NextResponse.json(
      { error: 'Failed to fetch directions' },
      { status: 500 }
    )
  }
}
