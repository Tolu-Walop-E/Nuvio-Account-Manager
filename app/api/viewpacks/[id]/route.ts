import { NextRequest, NextResponse } from 'next/server'
import { readLocalPack } from '@/studio/server/packStore'

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const clean = id.replace(/\.json$/i, '')
  const body = readLocalPack(clean)
  if (!body) {
    return NextResponse.json(
      { error: 'View pack expired or not found on this host' },
      { status: 404 }
    )
  }
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
