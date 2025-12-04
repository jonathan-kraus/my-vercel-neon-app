// pages/api/weather/hourly.ts
import { db } from '@/app/lib/db';
import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import type { WeatherHourlyPayload } from '@/app/types/weather';
import type { NextApiRequest, NextApiResponse } from 'next';
const prisma = new PrismaClient();
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const now = new Date();
  // Define the type based on your select
  type WeatherHourlySelected = Prisma.WeatherHourlyGetPayload<{
    select: {
      forecastTime: true;
      rainAccumulationAvg: true;
      rainAccumulationMax: true;
      rainAccumulationMin: true;
      rainAccumulationSum: true;
    };
  }>;
  // Now data is strongly typed
  const data: WeatherHourlySelected[] = await db.weatherHourly.findMany({
    where: {
      forecastTime: {
        gte: now,
        lt: new Date(now.getTime() + 5 * 60 * 60 * 1000),
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
    timestamp: row.forecastTime.toISOString(),
    rainAccumulationAvg: row.rainAccumulationAvg,
    rainAccumulationMax: row.rainAccumulationMax,
    rainAccumulationMin: row.rainAccumulationMin,
    rainAccumulationSum: row.rainAccumulationSum,
  }));

  res.status(200).json(payload);
}
