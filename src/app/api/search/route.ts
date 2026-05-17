import { NextRequest, NextResponse } from 'next/server'
import { search } from '@/lib/search'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') ?? ''

  if (!q || q.trim().length < 2) {
    return NextResponse.json({ results: [], query: q, total: 0 })
  }

  const results = search(q.trim())

  return NextResponse.json({
    results,
    query: q,
    total: results.length,
  })
}
