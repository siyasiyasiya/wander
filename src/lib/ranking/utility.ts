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
}

export function computeUtilityScore({
  rating,
  userRatingCount,
  distanceKm,
  maxDistanceKm,
  travelSeconds,
  maxTravelSeconds,
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

  return qualityScore * 0.5 + credibilityScore * 0.3 + proximityScore * 0.2
}
