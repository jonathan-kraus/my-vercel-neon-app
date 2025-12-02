import { createLogger } from '@/app/utils/logger';
import { generateUUID } from '@/uuidj';
import { flag } from 'flags/next';
export const bunnyFlag = flag({
  key: 'bunny-flag',
  decide() {
    return Math.random() > 0.5;
  },
});
export async function GET() {
  const requestId = generateUUID();
  // Generate some test logs
  const log = createLogger('api/test', requestId);
  await log.info('api test info ', { action: 'checkDbConnection', email: 'bypass_throttle' });
  await log.error('api test error', { action: 'checkDbConnection', email: 'bypass_throttle' });
  await log.warn('api test warn ', { action: 'checkDbConnection', email: 'bypass_throttle' });
  return new Response('Test logs generated successfully ');
}
