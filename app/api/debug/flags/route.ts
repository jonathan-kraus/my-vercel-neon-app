import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get database flags
    const dbFlags = await db.featureFlag.findMany({
      where: { category: 'location' },
      select: { name: true, enabled: true },
      orderBy: { name: 'asc' },
    });

    // Get env vars
    const envFlags = {
      LOCATION_KOP: process.env.FEATURE_LOCATION_KOP,
      LOCATION_NEW_YORK: process.env.FEATURE_LOCATION_NEW_YORK,
      LOCATION_SAN_FRANCISCO: process.env.FEATURE_LOCATION_SAN_FRANCISCO,
      LOCATION_BROOKLINE: process.env.FEATURE_LOCATION_BROOKLINE,
      LOCATION_WILLIAMSTOWN: process.env.FEATURE_LOCATION_WILLIAMSTOWN,
    };

    return NextResponse.json({
      database: dbFlags,
      envVars: envFlags,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Debug flags error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
