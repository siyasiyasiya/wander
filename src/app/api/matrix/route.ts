import { NextRequest, NextResponse } from 'next/server'
import { createRoutingProvider } from '@/lib/routing/client'
import type { MatrixParams } from '@/lib/routing/types'

export async function POST(req: NextRequest) {
  const body: MatrixParams = await req.json()

  try {
    const provider = createRoutingProvider()
    const result = await provider.fetchMatrix(body)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[matrix]', err)
    return NextResponse.json(
      { error: 'Failed to fetch matrix' },
      { status: 500 }
    )
  }
}
