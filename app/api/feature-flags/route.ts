import { NextResponse } from 'next/server';
import { getAllFeatureFlagsFromDB } from '@/app/utils/featureFlags';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const flags = await getAllFeatureFlagsFromDB();
    return NextResponse.json(flags, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error) {
    console.error('Failed to fetch feature flags:', error);
    return NextResponse.json({ error: 'Failed to fetch feature flags' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, enabled } = await req.json();

    if (!name || typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { db } = await import('@/app/lib/db');
    const { clearFeatureFlagsCache } = await import('@/app/utils/featureFlags');

    const updated = await db.featureFlag.update({
      where: { name },
      data: { enabled },
    });

    // Clear the shared cache
    clearFeatureFlagsCache();

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update feature flag:', error);
    return NextResponse.json({ error: 'Failed to update feature flag' }, { status: 500 });
  }
}
