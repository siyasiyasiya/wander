'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { setOptions } from '@googlemaps/js-api-loader'

interface MapContextValue {
  isLoaded: boolean
  loadError: Error | null
}

const MapContext = createContext<MapContextValue>({ isLoaded: false, loadError: null })

export function MapProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [loadError, setLoadError] = useState<Error | null>(null)

  useEffect(() => {
    // setOptions installs google.maps.importLibrary (lazy-loads the script on first call)
    setOptions({
      key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
      v: 'weekly',
    })

    google.maps
      .importLibrary('maps')
      .then(() => setIsLoaded(true))
      .catch((err: unknown) =>
        setLoadError(err instanceof Error ? err : new Error(String(err)))
      )
  }, [])

  return (
    <MapContext.Provider value={{ isLoaded, loadError }}>
      {children}
    </MapContext.Provider>
  )
}

export const useMapLoader = () => useContext(MapContext)
