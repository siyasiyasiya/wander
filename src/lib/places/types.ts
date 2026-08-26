export interface PlaceBase {
  place_id: string
  name: string
  lat: number
  lng: number
  categories: string[]
}

export interface PlaceEnriched extends PlaceBase {
  rating?: number
  userRatingCount?: number
  openNow?: boolean
  googleMapsUri?: string
  hoursToday?: string
  photoName?: string
  utilityScore: number
}
