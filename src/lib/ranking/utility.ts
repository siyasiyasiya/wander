// mode 0 = specific need (prioritize getting there fast, matching the ask)
// mode 1 = vibe/mood (prioritize quality + how well it matches the mood)
// mode 2 = exploratory/"surprise me" (kept balanced — feeds pickOverlooked, not
// a direct ranking, and there's usually no specific category to match against)
type UtilityMode = 0 | 1 | 2

interface WeightProfile {
  quality: number
  credibility: number
  proximity: number
  relevance: number
}

const WEIGHT_PROFILES: Record<UtilityMode, WeightProfile> = {
  0: { quality: 0.20, credibility: 0.10, proximity: 0.45, relevance: 0.25 },
  1: { quality: 0.40, credibility: 0.20, proximity: 0.15, relevance: 0.25 },
  2: { quality: 0.50, credibility: 0.30, proximity: 0.20, relevance: 0.00 },
}

interface UtilityParams {
  rating?: number
  userRatingCount?: number
  distanceKm: number
  maxDistanceKm: number
  // Real routed travel time, when known, and the time budget it should be judged
  // against. Preferred over straight-line distance — a 1km walk along a highway
  // can take far longer than a 1km walk through a grid of streets.
  travelSeconds?: number
  maxTravelSeconds?: number
  // 0-1: how well this place matches the searched category/intent (from Google's
  // own text-relevance ranking). Undefined/no category search => treated as a
  // neutral, non-penalizing match.
  relevanceScore?: number
  mode?: UtilityMode
}

export function computeUtilityScore({
  rating,
  userRatingCount,
  distanceKm,
  maxDistanceKm,
  travelSeconds,
  maxTravelSeconds,
  relevanceScore,
  mode,
}: UtilityParams): number {
  const qualityScore = rating != null ? rating / 5.0 : 0.5
  // Log-scaled instead of linear /500 — a handful of great reviews shouldn't be
  // crushed by a mediocre chain with hundreds. log10(501) normalizes to 1 at the cap.
  const credibilityScore =
    userRatingCount != null ? Math.min(Math.log10(userRatingCount + 1) / Math.log10(501), 1) : 0
  const proximityScore =
    travelSeconds != null && maxTravelSeconds
      ? Math.max(0, 1 - travelSeconds / maxTravelSeconds)
      : maxDistanceKm > 0
        ? Math.max(0, 1 - distanceKm / maxDistanceKm)
        : 0
  const relevance = relevanceScore ?? 1

  const w = WEIGHT_PROFILES[mode ?? 2]
  return qualityScore * w.quality + credibilityScore * w.credibility + proximityScore * w.proximity + relevance * w.relevance
}
