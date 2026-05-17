import { NextResponse } from 'next/server'
import { getHeroDemos } from '@/lib/search'

export async function GET() {
  const heroes = getHeroDemos()
  return NextResponse.json({ results: heroes })
}
