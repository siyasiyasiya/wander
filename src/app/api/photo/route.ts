import { NextRequest, NextResponse } from 'next/server'

// Matches Google Places (New) photo resource names, e.g. "places/ChIJ.../photos/AUc7t..."
const PHOTO_NAME_RE = /^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get('name')
  const maxWidthPx = Math.min(Math.max(Number(req.nextUrl.searchParams.get('w')) || 480, 100), 1600)

  if (!name || !PHOTO_NAME_RE.test(name)) {
    return NextResponse.json({ error: 'Invalid photo name' }, { status: 400 })
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Photo API not configured' }, { status: 500 })
  }

  try {
    const res = await fetch(
      `https://places.googleapis.com/v1/${name}/media?maxWidthPx=${maxWidthPx}&key=${apiKey}`,
    )

    if (!res.ok || !res.body) {
      return NextResponse.json({ error: `Photo fetch failed (${res.status})` }, { status: 502 })
    }

    return new NextResponse(res.body, {
      headers: {
        'Content-Type': res.headers.get('content-type') ?? 'image/jpeg',
        'Cache-Control': 'public, max-age=86400, s-maxage=604800',
      },
    })
  } catch (err) {
    console.error('[photo]', err)
    return NextResponse.json({ error: 'Failed to fetch photo' }, { status: 500 })
  }
}
