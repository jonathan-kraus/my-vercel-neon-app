import { NextResponse } from 'next/server';
import { generateUUID } from '@/uuidj';
import { createLogger } from '@/app/utils/logger';

export async function GET(request: Request) {
  const requestId = generateUUID();
  const log = createLogger('app/api/neon-consumption/route.ts', requestId);

  try {
    const apiKey = process.env.NEON_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'NEON_API_KEY not configured' }, { status: 500 });
    }

    // Get query parameters for date range
    const { searchParams } = new URL(request.url);
    const from =
      searchParams.get('from') || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const to = searchParams.get('to') || new Date().toISOString();
    const limit = searchParams.get('limit') || '10';
    const granularity = searchParams.get('granularity') || 'hourly'; // Required: hourly, daily, monthly

    // Construct API URL with query parameters
    const apiUrl = new URL('https://console.neon.tech/api/v2/consumption_history/projects');
    apiUrl.searchParams.set('from', from);
    apiUrl.searchParams.set('to', to);
    apiUrl.searchParams.set('limit', limit);
    apiUrl.searchParams.set('granularity', granularity); // Always set (required by Neon API)
    if (searchParams.get('cursor')) {
      apiUrl.searchParams.set('cursor', searchParams.get('cursor')!);
    }

    // Log the actual URL being called for debugging
    await log.info('Calling Neon API', {
      url: apiUrl.toString(),
      params: { from, to, limit, granularity },
    });

    // Fetch consumption history from Neon API
    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      await log.error('Neon API error', {
        status: response.status,
        details: errorText,
      });
      return NextResponse.json(
        {
          error: `Neon API error: ${response.status}`,
          details: errorText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      ...data,
      period: { from, to },
    });
  } catch (error) {
    await log.error('Error fetching consumption metrics', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        error: 'Failed to fetch consumption metrics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
