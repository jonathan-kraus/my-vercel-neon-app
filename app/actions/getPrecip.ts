import { db } from '../lib/db';
import { createLogger } from '../utils/logger';
const precip = await db.weatherCache.findFirst({
  where: { location: 'kop' },
  orderBy: { updatedAt: 'desc' },
  select: { rainAccumulationSum: true },
});
const log = createLogger('app/actions/getPrecip.ts');
log.info('Precipitation data retrieved', { location: 'kop', precip });
export default precip;
