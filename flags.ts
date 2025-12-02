import { createLogger } from '@/app/utils/logger';
import { generateUUID } from '@/uuidj';
import flag from 'flags/next';
export const bunnyFlag = flag({
  key: 'bunny-flag',
  decide() {
    return Math.random() > 0.5;
  },
});
const requestId = generateUUID();
const log = createLogger('flags.ts', requestId);
export async function logSend(requestId: string) {
  const log = createLogger('flags.ts', requestId);
}
logSend(requestId).then(async () => {
  await log.info('bunnyFlag evaluated', { value: bunnyFlag });
});
