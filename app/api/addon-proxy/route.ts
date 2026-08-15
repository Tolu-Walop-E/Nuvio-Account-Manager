import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get('url')?.trim() ?? ''
  if (!/^https?:\/\//i.test(target)) {
    return NextResponse.json({ error: 'Missing or invalid url query param' }, { status: 400 })
  }

  try {
    const upstream = await fetch(target, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'NuvioReframeStudio/0.1',
      },
      signal: AbortSignal.timeout(20_000),
    })
    const body = await upstream.arrayBuffer()
    const contentType = upstream.headers.get('content-type') || 'application/json'
    return new NextResponse(body, {
      status: upstream.status,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const status = /timeout/i.test(message) ? 504 : 502
    return NextResponse.json({ error: message }, { status })
  }
}
