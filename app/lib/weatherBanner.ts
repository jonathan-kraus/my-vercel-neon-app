// lib/weatherBanner.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export type Banner = {
  show: boolean;
  reason?: string;
  earliest?: string; // ISO timestamp
  details?: {
    forecastTime: string;
    rainAccumulationMax: number;
    precipitationProbability: number;
  }[];
};

export async function getRainBannerForNextHours(
  locationName: string,
  hours = 6,
  probThreshold = 30, // percent threshold for precipitationProbability
  accumThreshold = 0.0001 // treat >0 as rain; adjust if you want a higher cutoff
): Promise<Banner> {
  const now = new Date();
  const end = new Date(now.getTime() + hours * 60 * 60 * 1000);

  const rows = await prisma.weatherHourly.findMany({
    where: {
      location: locationName,
      forecastTime: { gte: now, lt: end },
      OR: [
        { rainAccumulationMax: { gt: accumThreshold } },
        { precipitationProbability: { gte: probThreshold } },
      ],
    },
    orderBy: { forecastTime: 'asc' },
  });

  if (!rows || rows.length === 0) return { show: false };

  const details = rows.map(
    (r: {
      forecastTime: { toISOString: () => any };
      rainAccumulationMax: any;
      precipitationProbability: any;
    }) => ({
      forecastTime: r.forecastTime.toISOString(),
      rainAccumulationMax: Number(r.rainAccumulationMax ?? 0),
      precipitationProbability: Number(r.precipitationProbability ?? 0),
    })
  );

  const earliest = details[0].forecastTime;
  const willRain = details.some(
    (d: { rainAccumulationMax: number }) => d.rainAccumulationMax > accumThreshold
  );
  const highProb = details.some(
    (d: { precipitationProbability: number }) => d.precipitationProbability >= probThreshold
  );

  const reasons: string[] = [];
  if (willRain) reasons.push('rain accumulation expected');
  if (highProb) reasons.push(`precipitation probability ≥ ${probThreshold}%`);

  return {
    show: true,
    reason: reasons.join(' and '),
    earliest,
    details,
  };
}
