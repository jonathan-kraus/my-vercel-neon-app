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
      timestamp: true;
      rainAccumulationAvg: true;
      rainAccumulationMax: true;
      rainAccumulationMin: true;
      rainAccumulationSum: true;
    };
  }>;
  // Now data is strongly typed
  const data: WeatherHourlySelected[] = await db.weatherHourly.findMany({
    where: {
      timestamp: {
        gte: now,
        lt: new Date(now.getTime() + 5 * 60 * 60 * 1000),
      },
    },
    select: {
      timestamp: true,
      rainAccumulationAvg: true,
      rainAccumulationMax: true,
      rainAccumulationMin: true,
      rainAccumulationSum: true,
    },
    orderBy: { timestamp: 'asc' },
  });

  // Convert Date → string for JSON safety
  const payload: WeatherHourlyPayload[] = data.map((row) => ({
    timestamp: row.timestamp.toISOString(),
    rainAccumulationAvg: row.rainAccumulationAvg,
    rainAccumulationMax: row.rainAccumulationMax,
    rainAccumulationMin: row.rainAccumulationMin,
    rainAccumulationSum: row.rainAccumulationSum,
  }));

  res.status(200).json(payload);
}
