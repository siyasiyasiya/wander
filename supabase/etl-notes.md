# POI Data ETL Notes

## Dataset options

| Dataset | Size | License | Source |
|---|---|---|---|
| Foursquare Open Source Places | 100M+ POIs | Apache 2.0 | https://opensource.foursquare.com/os-places/ |
| Overture Maps Places | 75M+ POIs | CDLA Permissive 2.0 | https://overturemaps.org/download/ |

Both are free for commercial use. Start with one city to keep the initial load small.

## Load flow (Foursquare OS Places example)

1. Download the Parquet file for your target city from the Foursquare dataset.
2. Filter to the city bounding box using DuckDB or pandas.
3. Map columns to the `places` schema:
   - `fsq_place_id` → `fsq_id`
   - `name` → `name`
   - `latitude` → `lat`
   - `longitude` → `lng`
   - `categories[*].name` → `categories` (TEXT[])
   - Generate a stable `place_id` (e.g. `'fsq_' || fsq_place_id`)
4. Export as CSV, bulk-load into Supabase via `COPY` or the Supabase Table Editor import.
5. The `trg_sync_place_geom` trigger auto-populates the `geom` column on insert.

## Getting Supabase connection string

Project Settings → Database → Connection string → URI mode.
Use the **Session mode** URI (port 5432) for long-lived Node.js connections.
Set it as `DATABASE_URL` in `.env.local`.
