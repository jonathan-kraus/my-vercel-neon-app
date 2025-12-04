// app/api/weather/hourly/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import type { Prisma } from '@prisma/client';

// Derive the exact type of the rows we’re selecting
type WeatherHourlySelected = Prisma.WeatherHourlyGetPayload<{
  select: {
    forecastTime: true;
    rainAccumulationAvg: true;
    rainAccumulationMax: true;
    rainAccumulationMin: true;
    rainAccumulationSum: true;
  };
}>;

// Define the payload type we’ll send to the client (Date → string)
export type WeatherHourlyPayload = {
  forecastTime: string;
  rainAccumulationAvg: number;
  rainAccumulationMax: number;
  rainAccumulationMin: number;
  rainAccumulationSum: number;
};

export async function GET() {
  const now = new Date();

  // Strongly typed query result
  const data: WeatherHourlySelected[] = await db.weatherHourly.findMany({
    where: {
      forecastTime: {
        gte: now,
        lt: new Date(now.getTime() + 5 * 60 * 60 * 1000), // next 5 hours
      },
    },
    select: {
      forecastTime: true,
      rainAccumulationAvg: true,
      rainAccumulationMax: true,
      rainAccumulationMin: true,
      rainAccumulationSum: true,
    },
    orderBy: { forecastTime: 'asc' },
  });

  // Convert Date → string for JSON safety
  const payload: WeatherHourlyPayload[] = data.map((row) => ({
    forecastTime: row.forecastTime.toISOString(),
    rainAccumulationAvg: row.rainAccumulationAvg,
    rainAccumulationMax: row.rainAccumulationMax,
    rainAccumulationMin: row.rainAccumulationMin,
    rainAccumulationSum: row.rainAccumulationSum,
  }));

  return NextResponse.json(payload);
}
