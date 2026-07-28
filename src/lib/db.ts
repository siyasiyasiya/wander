import { Pool } from 'pg'

let pool: Pool | null = null

export function getDb(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set — add it to .env.local (see supabase/etl-notes.md)')
  }
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 })
  }
  return pool
}
