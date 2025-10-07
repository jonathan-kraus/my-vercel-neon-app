import { NextResponse } from 'next/server'
import { db } from '@/app/lib/db' 
export async function POST(req: Request) {
  const body = await req.json()

  const { severity = 'info', source, message, requestId, metadata } = body

  try {
    await db.log.create({
      data: {
        severity,
        source,
        message,
        requestId,
        metadata: metadata ?? {},
        timestamp: new Date(),
      },
    })

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
  console.error('Log insert failed:', error)

  const message = error instanceof Error ? error.message : 'Unknown error'

  return NextResponse.json({ status: 'error', error: message }, { status: 500 })
}
}
