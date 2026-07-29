export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { classifyIntent } from '@/lib/intent/classify'


export async function POST(req: Request) {
  const apiKey = process.env.LLM_PROVIDER_API_KEY
  const model = process.env.LLM_MODEL ?? 'gemini-3.1-flash-lite'

  if (!apiKey) return NextResponse.json({ mode: 1, category: '' })

  const { text }: { text: string } = await req.json()
  if (!text.trim()) return NextResponse.json({ mode: 1, category: '' })

  try {
    console.log('[intent] classifying:', JSON.stringify(text), 'model:', model)
    const result = await classifyIntent(text, apiKey, model)
    console.log('[intent] result:', result)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[intent] error:', err)
    return NextResponse.json({ mode: 1, category: '' })
  }
}
