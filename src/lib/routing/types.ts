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

export interface MatrixParams {
  originLat: number
  originLng: number
  destinations: { lat: number; lng: number }[]
  mode: TravelMode
}

export interface MatrixResult {
  seconds: (number | null)[]
}
