-- Run this in Supabase SQL editor (Database > SQL Editor)

-- PostGIS is pre-enabled on Supabase; this is a no-op but harmless
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS places (
  place_id   TEXT PRIMARY KEY,
  fsq_id     TEXT,
  name       TEXT        NOT NULL,
  lat        DOUBLE PRECISION NOT NULL,
  lng        DOUBLE PRECISION NOT NULL,
  categories TEXT[]      NOT NULL DEFAULT '{}',
  geom       GEOMETRY(Point, 4326)
);

-- Spatial index — required for ST_Within performance
CREATE INDEX IF NOT EXISTS places_geom_idx ON places USING GIST(geom);

-- Keep geom in sync when lat/lng are inserted/updated
CREATE OR REPLACE FUNCTION sync_place_geom()
RETURNS TRIGGER AS $$
BEGIN
  NEW.geom := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_sync_place_geom
  BEFORE INSERT OR UPDATE OF lat, lng ON places
  FOR EACH ROW EXECUTE FUNCTION sync_place_geom();
