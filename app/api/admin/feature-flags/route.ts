import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { clearFeatureFlagsCache } from '@/app/utils/featureFlags';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const flags = await db.featureFlag.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json(flags);
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

    const updated = await db.featureFlag.update({
      where: { name },
      data: { enabled },
    });

    // Clear the cache so changes take effect immediately
    clearFeatureFlagsCache();

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update feature flag:', error);
    return NextResponse.json({ error: 'Failed to update feature flag' }, { status: 500 });
  }
}
