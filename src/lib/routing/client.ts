import { ORS_PROFILES } from '@/lib/isochrone/types'
import type { RouteParams, RouteResult, MatrixParams, MatrixResult } from './types'

export interface RoutingProvider {
  fetchRoute(params: RouteParams): Promise<RouteResult>
  fetchMatrix(params: MatrixParams): Promise<MatrixResult>
}

class ORSRoutingProvider implements RoutingProvider {
  constructor(private apiKey: string) {}

  async fetchRoute(params: RouteParams): Promise<RouteResult> {
    const profile = ORS_PROFILES[params.mode]
    const res = await fetch(
      `https://api.openrouteservice.org/v2/directions/${profile}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: this.apiKey,
        },
        body: JSON.stringify({
          coordinates: [
            [params.originLng, params.originLat],
            [params.destLng, params.destLat],
          ],
        }),
      }
    )

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`ORS API ${res.status}: ${text}`)
    }

    const data = await res.json()
    const summary = data.routes[0].summary
    return { seconds: summary.duration, meters: summary.distance }
  }

  // One-to-many: real routed durations for a whole candidate pool in a single
  // call, instead of fetchRoute() N times (used to rank by actual travel time).
  async fetchMatrix(params: MatrixParams): Promise<MatrixResult> {
    const profile = ORS_PROFILES[params.mode]
    const locations = [
      [params.originLng, params.originLat],
      ...params.destinations.map((d) => [d.lng, d.lat]),
    ]
    const res = await fetch(
      `https://api.openrouteservice.org/v2/matrix/${profile}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: this.apiKey,
        },
        body: JSON.stringify({
          locations,
          sources: [0],
          destinations: params.destinations.map((_, i) => i + 1),
          metrics: ['duration'],
        }),
        signal: AbortSignal.timeout(12000),
      }
    )

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`ORS API ${res.status}: ${text}`)
    }

    const data = await res.json()
    return { seconds: data.durations[0] }
  }
}

export function createRoutingProvider(): RoutingProvider {
  const apiKey = process.env.ORS_API_KEY
  if (!apiKey) throw new Error('ORS_API_KEY is not set')
  return new ORSRoutingProvider(apiKey)
}
