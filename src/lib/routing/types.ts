import type { TravelMode } from '@/lib/isochrone/types'

export interface RouteParams {
  originLat: number
  originLng: number
  destLat: number
  destLng: number
  mode: TravelMode
}

export interface RouteResult {
  seconds: number
  meters: number
}
