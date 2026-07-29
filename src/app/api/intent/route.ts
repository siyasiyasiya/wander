export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { classifyIntent } from '@/lib/intent/classify'

export async function POST(req: Request) {
  const apiKey = process.env.LLM_PROVIDER_API_KEY
  const model = process.env.LLM_MODEL ?? 'gemini-2.0-flash-lite'

  if (!apiKey) return NextResponse.json({ mode: 1, category: '' })

  const { text }: { text: string } = await req.json()
  if (!text.trim()) return NextResponse.json({ mode: 1, category: '' })

  try {
    const result = await classifyIntent(text, apiKey, model)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[intent]', err)
    return NextResponse.json({ mode: 1, category: '' })
  }
}
