declare namespace NodeJS {
  interface ProcessEnv {
    // Phase 1
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: string
    NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID?: string
    ORS_API_KEY: string
    // Phase 3
    GOOGLE_PLACES_API_KEY?: string
    // Phase 4
    LLM_PROVIDER_API_KEY?: string
    LLM_MODEL?: string
  }
}
