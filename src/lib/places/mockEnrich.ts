import type { PlaceBase } from './types'
import type { IntentMode } from '@/lib/theme'

// Live rating/review/hours enrichment (Google Places) is Phase 3 of the roadmap
// and not wired up yet. Everything here is a stable, deterministic placeholder —
// never presented to users as real Google data (see legal note in the UI copy).
export interface EnrichedPlace extends PlaceBase {
  rating: number
  reviews: number
  reviewsLabel: string
  openLabel: string
  isOpenNow: boolean
  hoursToday: string
  quote: string
  why: string
  src: string
  tag: string
  googleMapsUri?: string
  isLiveData?: boolean
}

function hashStr(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function rand(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function pick<T>(pool: readonly T[], seed: number): T {
  return pool[Math.floor(rand(seed) * pool.length) % pool.length]
}

const OPEN_LABELS = ['Open until 6', 'Open until 7', 'Open until 8', 'Open till 10', 'Open till 11', 'Open till midnight'] as const
const CLOSED_LABELS = ['Closes 5:30', 'Closed for the day'] as const
const HOURS_TODAY = ['8 am – 6 pm', '9 am – 7 pm', '10 am – 8 pm', '4 pm – 11 pm', '11 am – 10 pm'] as const

const QUOTES: Record<IntentMode, readonly string[]> = {
  0: ['got me in the same week', 'never a long wait', 'straightforward, no surprises', 'easy to book, easier to get to'],
  1: ['the kind of place you stay longer than planned', 'quiet enough to actually focus', 'always feels like a good call', 'exactly the right kind of place'],
  2: ['not the obvious pick, and that’s the point', 'overlooked, and that’s exactly why it’s good', 'the kind of find you don’t search for', 'empty on weeknights, which is the whole point'],
}

const WHY: Record<IntentMode, readonly string[]> = {
  0: ['Comes up again and again in reviews for fast turnaround.', 'Consistently rated for reliability by nearby reviewers.', 'The most consistent hours of the reachable options.', 'Highest-rated match with recent reviews.'],
  1: ['Fits the mood more than the literal ask — worth the extra minutes.', 'A little off the obvious pick, in a good way.', 'Reviewers keep describing it as exactly the right kind of place.'],
  2: ['Nobody’s top result — but right for this hour.', 'Overlooked by most searches, loved by everyone who’s been.', 'The kind of gem worth the reroll.'],
}

const TAGS: Record<IntentMode, readonly string[]> = {
  0: ['Best match', 'Reliable', 'Closest', 'Fastest booking'],
  1: ['Quietest', 'Worth the walk', 'Local favorite'],
  2: ['Overlooked', 'Underrated', 'Not the obvious pick'],
}

export function enrichPlace(place: PlaceBase, mode: IntentMode): EnrichedPlace {
  const h = hashStr(place.place_id)
  const isOpenNow = rand(h) > 0.12
  const openLabel = isOpenNow ? pick(OPEN_LABELS, h + 1) : pick(CLOSED_LABELS, h + 1)
  const rating = Math.round((3.9 + rand(h + 2) * 1.0) * 10) / 10
  const reviews = Math.round(15 + rand(h + 3) * 335)
  const modeHash = hashStr(`${place.place_id}:${mode}`)

  return {
    ...place,
    rating,
    reviews,
    reviewsLabel: `${reviews} reviews`,
    openLabel,
    isOpenNow,
    hoursToday: pick(HOURS_TODAY, h + 4),
    quote: pick(QUOTES[mode], modeHash),
    why: pick(WHY[mode], modeHash + 1),
    src: `${reviews} public reviews`,
    tag: pick(TAGS[mode], modeHash + 2),
  }
}
