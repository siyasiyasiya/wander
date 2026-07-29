interface UtilityParams {
  rating?: number
  userRatingCount?: number
  distanceKm: number
  maxDistanceKm: number
}

export function computeUtilityScore({ rating, userRatingCount, distanceKm, maxDistanceKm }: UtilityParams): number {
  const qualityScore = rating != null ? rating / 5.0 : 0.5
  const credibilityScore = userRatingCount != null ? Math.min(userRatingCount, 500) / 500 : 0
  const proximityScore = maxDistanceKm > 0 ? Math.max(0, 1 - distanceKm / maxDistanceKm) : 0

  return qualityScore * 0.5 + credibilityScore * 0.3 + proximityScore * 0.2
}
