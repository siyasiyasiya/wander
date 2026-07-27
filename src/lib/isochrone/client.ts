import type { GeoJSONPolygon, IsochroneParams, TravelMode } from './types'

export interface IsochroneProvider {
  fetchIsochrone(params: IsochroneParams): Promise<GeoJSONPolygon>
}

// ORS profile names for each travel mode
const ORS_PROFILES: Record<TravelMode, string> = {
  walk: 'foot-walking',
  drive: 'driving-car',
  bike: 'cycling-regular',
}

class ORSIsochroneProvider implements IsochroneProvider {
  constructor(private apiKey: string) {}

  async fetchIsochrone(params: IsochroneParams): Promise<GeoJSONPolygon> {
    const profile = ORS_PROFILES[params.mode]
    const res = await fetch(
      `https://api.openrouteservice.org/v2/isochrones/${profile}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: this.apiKey,
        },
        body: JSON.stringify({
          locations: [[params.lng, params.lat]], // ORS expects [lng, lat]
          range: [params.seconds],
          range_type: 'time',
        }),
      }
    )

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`ORS API ${res.status}: ${text}`)
    }

    const data = await res.json()
    // ORS returns a FeatureCollection; take the first (and only) feature
    return data.features[0] as GeoJSONPolygon
  }
}

export function createIsochroneProvider(): IsochroneProvider {
  const apiKey = process.env.ORS_API_KEY
  if (!apiKey) throw new Error('ORS_API_KEY is not set')
  return new ORSIsochroneProvider(apiKey)
}
