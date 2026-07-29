export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { narratePlaces } from '@/lib/intent/narrate'
import type { IntentMode } from '@/lib/theme'

export async function POST(req: Request) {
  const apiKey = process.env.LLM_PROVIDER_API_KEY
  const model = process.env.LLM_MODEL ?? 'gemini-3.1-flash-lite'
  if (!apiKey) return NextResponse.json({})

  const { places, mode }: {
    places: { place_id: string; name: string; categories: string[] }[]
    mode: IntentMode
  } = await req.json()

  if (!places?.length) return NextResponse.json({})

  try {
    const map = await narratePlaces(places, mode, apiKey, model)
    return NextResponse.json(Object.fromEntries(map))
  } catch (err) {
    console.error('[narrate]', err)
    return NextResponse.json({})
  }
}
