import type { EnrichedPlace } from '@/lib/places/mockEnrich'

export type RankedPlace = EnrichedPlace & { utilityScore: number }
