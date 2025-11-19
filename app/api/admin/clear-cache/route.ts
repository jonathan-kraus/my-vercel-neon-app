import { NextResponse } from 'next/server';
import { clearFeatureFlagsCache } from '@/app/utils/featureFlags';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    clearFeatureFlagsCache();
    return NextResponse.json({
      success: true,
      message: 'Feature flags cache cleared',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to clear cache:', error);
    return NextResponse.json({ error: 'Failed to clear cache' }, { status: 500 });
  }
}
