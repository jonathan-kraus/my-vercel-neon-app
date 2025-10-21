import { db } from '@/app/lib/db'
import { NextResponse } from 'next/server'
console.log('[build] Generating /logs');
export async function GET() {
  try {
    const logs = await db.log.findMany({
      orderBy: { timestamp: 'desc' },
      take: 50, // adjust as needed
    })

    return NextResponse.json(logs)
  } catch (error) {
    console.error('Failed to fetch logs:', error)
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
  }
}
