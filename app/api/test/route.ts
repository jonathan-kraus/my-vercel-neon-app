import { createLogger } from "@/app/utils/logger";
import { generateUUID } from '@/uuidj';
console.log('[build] Generating /api/test');
export async function GET() {
  console.log('🧪 Test route hit - generating test logs');
  const requestId = generateUUID();
  // Generate some test logs 
  const log = createLogger('api/test', requestId);
    await log.info('api test info ', { action: 'checkDbConnection', email: 'bypass_throttle' });
    await log.error('api test error', { action: 'checkDbConnection', email: 'bypass_throttle' });
    await log.warn('api test warn ', { action: 'checkDbConnection', email: 'bypass_throttle' });
  console.log('✅ Generated test logs');
  return new Response('Test logs generated successfully ');
}
