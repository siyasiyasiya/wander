<div align="center">

# WANDER

### **discover great places within your actual reachable time — not a circle on a map.**

[![built with Next.js](https://img.shields.io/badge/Built%20with-Next.js%2016-black?style=for-the-badge)](https://nextjs.org)
[![powered by Gemini](https://img.shields.io/badge/Powered%20by-Google%20Gemini-blue?style=for-the-badge)](https://ai.google.dev)
[![routing by OpenRouteService](https://img.shields.io/badge/Routing%20by-OpenRouteService-orange?style=for-the-badge)](https://openrouteservice.org)

<br />

**drop a pin, set a time budget and a way of getting around, and wander shows you every good place actually reachable in that time — ranked by an intent-aware model, not a fixed-radius search.**

[live demo](https://wander-beige-theta.vercel.app)

</div>

---

## why

every "places near me" app draws a circle around you and calls it a radius. that circle lies — 15 minutes of walking looks nothing like 15 minutes of driving, and neither looks like a circle once you factor in a highway, a river, or a hill.

wander computes the actual reachable area (an isochrone) for your time budget and travel mode, then only surfaces places genuinely inside it. no ranking places you can't get to in time, no missing places a circle happened to cut off.

---

## how it works

```
origin + time budget + travel mode
        ↓
OpenRouteService isochrone → true reachable-area polygon
        ↓
Google Places (New) search, clipped to the polygon
        ↓
Gemini classifies intent → specific need / vibe / surprise me
        ↓
ranked by real routed travel time + rating + review credibility +
category relevance, weighted differently per intent mode
        ↓
Gemini narrates each result (quote, why, tag)
        ↓
place cards + live photos on the map
```

---

## features

- **three ways to search**
  - **specific need** — "nearest pharmacy" — weighted hard toward proximity
  - **vibe** — "cozy coffee to work from" — weighted toward quality and how well it matches the mood
  - **surprise me** — samples genuine hidden gems (high rating, low review count), not just "popular, ranked #6"
- **real travel time, not straight-line distance** — one batched routing call ranks every candidate by actual walk/bike/drive time, not haversine distance
- **category diversity** — a plain score sort can hand back five coffee shops in a row; results are capped per category so the list doesn't repeat itself
- **session-level feedback** — dismissing a place ("not for me") nudges that category down in future rankings for the rest of the session
- **live Google data** — real ratings, review counts, hours, and photos, proxied server-side so no API key reaches the client
- **AI narration** — every place gets a short quote, a one-line "why," and a tag, generated per intent mode so the tone matches what you're looking for

---

## tech stack

| layer | tech | purpose |
|-------|------|---------|
| **framework** | Next.js 16 (App Router, Turbopack) | routing, server + client components, API routes |
| **maps** | Google Maps JS API | interactive map, origin pin, place markers |
| **places** | Google Places API (New) | live search, ratings, hours, photos |
| **routing** | OpenRouteService | isochrone polygons, real travel-time matrix |
| **intent + narration** | Google Gemini (`@google/genai`) | classifies search intent, writes place copy |
| **database** | Postgres / Supabase | persistence layer |
| **deployment** | Vercel | hosting, preview + production deploys |

---

## setup

1. clone the repo and install dependencies:

```bash
git clone https://github.com/siyasiyasiya/wander.git
cd wander
npm install
```

2. copy `.env.local.example` (or create `.env.local`) with:

| variable | where to get it |
|----------|------------------|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | [Google Cloud Console](https://console.cloud.google.com/) — restrict to Maps JS API |
| `GOOGLE_PLACES_API_KEY` | Google Cloud Console — Places API (New) |
| `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` | optional — leave empty to use the demo map ID in dev |
| `ORS_API_KEY` | free at [openrouteservice.org/dev](https://openrouteservice.org/dev/#/signup) |
| `DATABASE_URL` | your Postgres / Supabase connection string |
| `LLM_PROVIDER_API_KEY` | Gemini API key |

3. run it:

```bash
npm run dev
```

open [http://localhost:3000](http://localhost:3000), drop a pin, and go.

---

## deployment

deployed on Vercel with auto-deploy on push to `main`:

```bash
npx vercel        # preview
npx vercel --prod # production
```
