import type { TravelMode } from '@/lib/isochrone/types'

const SPEED_KMH: Record<TravelMode, number> = { walk: 5, bike: 15, drive: 35 }

export function estimateTravelMinutes(distanceKm: number, mode: TravelMode): number {
  return (distanceKm / SPEED_KMH[mode]) * 60
}

export function formatMinutes(minutes: number): string {
  return `${Math.max(1, Math.round(minutes))} min`
}
