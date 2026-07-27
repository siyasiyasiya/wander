export type TravelMode = 'walk' | 'drive' | 'bike'

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
