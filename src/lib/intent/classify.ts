import { GoogleGenerativeAI } from '@google/generative-ai'
import type { IntentMode } from '@/lib/theme'

const PROMPT = `You classify a user's intent for finding nearby places.
Return JSON only: {"mode": 0|1|2, "category": "string"}
- mode 0: specific need ("dentist", "pharmacy", "I need a barber", "nearest ATM")
- mode 1: vibe/mood ("cozy coffee", "somewhere quiet to work", "good lunch spot")
- mode 2: open/exploratory ("surprise me", "something interesting", "I don't know", "show me something good")
- category: short search-friendly place type ("coffee", "dentist", "park") or "" if none applies
- If input is empty, filler, or gibberish, return {"mode": 1, "category": ""}

User input: `

export async function classifyIntent(
  text: string,
  apiKey: string,
  model: string,
): Promise<{ mode: IntentMode; category: string }> {
  const genAI = new GoogleGenerativeAI(apiKey)
  const gemini = genAI.getGenerativeModel({ model })
  const result = await gemini.generateContent(PROMPT + text)
  const raw = result.response.text().trim().replace(/^```json\s*|```\s*$/g, '')
  const parsed = JSON.parse(raw)
  return {
    mode: ([0, 1, 2].includes(parsed.mode) ? parsed.mode : 1) as IntentMode,
    category: typeof parsed.category === 'string' ? parsed.category : '',
  }
}
