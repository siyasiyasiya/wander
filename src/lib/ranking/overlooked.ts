// Selects "excellent-but-overlooked" picks: excludes the top slice of the
// utility-ranked pool (the "obvious" picks) so results never overlap with
// `ranked`, then does seeded weighted sampling (Efraimidis–Spirakis) over
// the remainder, weighted by utilityScore so quality still wins probabilistically.
// Pure function of (items, seed) — deterministic so "reroll" stays client-side.
interface Scored {
  place_id: string
  utilityScore: number
}

const OBVIOUS_FRACTION = 0.3
const MIN_REMAINDER = 3
const EPS = 1e-3

function hashStr(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function seededUnit(seed: number, id: string): number {
  const h = hashStr(`${seed}:${id}`)
  const s = (h * 9301 + 49297) % 233280
  return Math.max(Math.abs(s) / 233280, 1e-6)
}

export function pickOverlooked<T extends Scored>(items: T[], seed: number, count = 3): T[] {
  if (items.length === 0) return []

  const sorted = [...items].sort((a, b) => b.utilityScore - a.utilityScore)
  const excludeCount = Math.min(
    Math.floor(sorted.length * OBVIOUS_FRACTION),
    Math.max(0, sorted.length - MIN_REMAINDER),
  )
  const pool = sorted.slice(excludeCount)

  return pool
    .map((item) => ({
      item,
      key: Math.pow(seededUnit(seed, item.place_id), 1 / Math.max(item.utilityScore, EPS)),
    }))
    .sort((a, b) => b.key - a.key)
    .slice(0, count)
    .map((w) => w.item)
}
