'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { Loader } from '@googlemaps/js-api-loader'

interface MapContextValue {
  isLoaded: boolean
  loadError: Error | null
}

const MapContext = createContext<MapContextValue>({ isLoaded: false, loadError: null })

export function MapProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [loadError, setLoadError] = useState<Error | null>(null)

  useEffect(() => {
    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
      version: 'weekly',
    })

    loader
      .load()
      .then(() => setIsLoaded(true))
      .catch((err: Error) => setLoadError(err))
  }, [])

  return (
    <MapContext.Provider value={{ isLoaded, loadError }}>
      {children}
    </MapContext.Provider>
  )
}

export const useMapLoader = () => useContext(MapContext)
