import { NextRequest, NextResponse } from 'next/server'
import { saveLocalPack } from '@/studio/server/packStore'

async function publishLitterbox(jsonBody: string): Promise<{ id: string; url: string } | null> {
  const form = new FormData()
  form.set('reqtype', 'fileupload')
  form.set('time', '72h')
  form.set('fileToUpload', new Blob([jsonBody], { type: 'application/json' }), 'view.json')
  try {
    const res = await fetch('https://litterbox.catbox.moe/resources/internals/api.php', {
      method: 'POST',
      headers: { 'User-Agent': 'NuvioReframeStudio/0.1' },
      body: form,
      signal: AbortSignal.timeout(25_000),
    })
    if (!res.ok) return null
    const url = (await res.text()).trim()
    if (!/^https?:\/\//i.test(url)) return null
    const id = url.split('/').pop()?.replace(/\.json$/i, '') || crypto.randomUUID()
    return { id, url }
  } catch {
    return null
  }
}

async function publishJsonblob(
  jsonBody: string,
  updateId?: string | null
): Promise<{ id: string; url: string } | null> {
  const path = updateId
    ? `https://jsonblob.com/api/jsonBlob/${encodeURIComponent(updateId)}`
    : 'https://jsonblob.com/api/jsonBlob'
  const res = await fetch(path, {
    method: updateId ? 'PUT' : 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'NuvioReframeStudio/0.1',
    },
    body: jsonBody,
    signal: AbortSignal.timeout(20_000),
  })
  if (res.status === 429) {
    throw new Error('Rate limited by jsonblob (HTTP 429). Try again in a minute, or use New link.')
  }
  if (!res.ok) return null
  const location = res.headers.get('location') || ''
  const headerId = res.headers.get('x-jsonblob-id') || ''
  const match = /\/api\/jsonBlob\/([^/?#]+)/i.exec(location)
  const id = headerId || match?.[1] || updateId
  if (!id) return null
  return {
    id,
    url: `https://jsonblob.com/api/jsonBlob/${encodeURIComponent(id)}`,
  }
}

export async function POST(req: NextRequest) {
  return publish(req, false)
}

export async function PUT(req: NextRequest) {
  return publish(req, true)
}

async function publish(req: NextRequest, isPut: boolean) {
  const jsonBody = await req.text()
  if (!jsonBody.trim()) {
    return NextResponse.json({ error: 'Empty body' }, { status: 400 })
  }

  const updateId = isPut ? req.nextUrl.searchParams.get('id') : null

  if (!isPut) {
    const litter = await publishLitterbox(jsonBody)
    if (litter) {
      return NextResponse.json({ ...litter, provider: 'litterbox' })
    }
  }

  try {
    const blob = await publishJsonblob(jsonBody, updateId)
    if (blob) {
      return NextResponse.json({ ...blob, provider: 'jsonblob' })
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (!/429|rate limit/i.test(msg)) {
      // fall through to local store
    }
  }

  const id = saveLocalPack(jsonBody)
  const origin = req.nextUrl.origin
  const url = `${origin}/api/viewpacks/${id}`
  return NextResponse.json({
    id,
    url,
    provider: 'local',
    note: 'Cloud publish was unavailable. This pack URL is hosted on Account Manager and may expire after idle deploys.',
  })
}
