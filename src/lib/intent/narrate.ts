import { GoogleGenAI } from '@google/genai'
import type { IntentMode } from '@/lib/theme'

interface PlaceSummary {
  place_id: string
  name: string
  categories: string[]
}

export type NarrateResult = { quote: string; why: string; tag: string }

const TONE: Record<IntentMode, string> = {
  0: 'Direct and reassuring — user has a specific need.',
  1: 'Warm and atmospheric — user wants something that fits a vibe.',
  2: 'Mysterious and intriguing — user wants a surprise discovery.',
}

export async function narratePlaces(
  places: PlaceSummary[],
  mode: IntentMode,
  apiKey: string,
  model: string,
): Promise<Map<string, NarrateResult>> {
  const ai = new GoogleGenAI({ apiKey })

  const prompt = `Write discovery copy for these nearby places.
For each place return: quote (≤8 words, atmospheric), why (1–2 sentences on why it's worth visiting), tag (2–3 word label, e.g. "Local favorite").
Base copy ONLY on name and place types. Do not invent specific menu items, hours, or experiences.
Tone: ${TONE[mode]}
Return JSON only: { "PLACE_ID": { "quote": "...", "why": "...", "tag": "..." }, ... }
Places: ${JSON.stringify(places.map(p => ({ id: p.place_id, name: p.name, types: p.categories })))}`

  const result = await ai.models.generateContent({
    model,
    contents: prompt,
    config: { maxOutputTokens: 512 },
  })

  const raw = (result.text ?? '').trim().replace(/^```json\s*|```\s*$/g, '')
  const parsed: Record<string, NarrateResult> = JSON.parse(raw)
  return new Map(Object.entries(parsed))
}
