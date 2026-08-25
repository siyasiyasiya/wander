export type TravelMode = 'walk' | 'drive' | 'bike'

// ORS profile names for each travel mode — shared by the isochrone and routing clients.
export const ORS_PROFILES: Record<TravelMode, string> = {
  walk: 'foot-walking',
  drive: 'driving-car',
  bike: 'cycling-regular',
}

export interface IsochroneParams {
  lat: number
  lng: number
  mode: TravelMode
  seconds: number
}

export interface GeoJSONPolygon {
  type: 'Feature'
  geometry: {
    type: 'Polygon'
    coordinates: number[][][]
  }
  properties: Record<string, unknown>
}
