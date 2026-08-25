import { ORS_PROFILES } from '@/lib/isochrone/types'
import type { RouteParams, RouteResult } from './types'

export interface RoutingProvider {
  fetchRoute(params: RouteParams): Promise<RouteResult>
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
}

export function createRoutingProvider(): RoutingProvider {
  const apiKey = process.env.ORS_API_KEY
  if (!apiKey) throw new Error('ORS_API_KEY is not set')
  return new ORSRoutingProvider(apiKey)
}
