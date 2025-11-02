import { db } from '@/app/lib/db';
import { randomUUID } from 'crypto';

console.log('[build] Generating /api/test');
export async function GET() {
  console.log('🧪 Test route hit - generating test logs');

  // Generate some test logs
  const logs = [
    { severity: 'info', source: 'test-api', message: 'Test log entry 1', requestId: randomUUID() },
    {
      severity: 'warning',
      source: 'test-api',
      message: 'Test log entry 2',
      requestId: randomUUID(),
    },
    { severity: 'error', source: 'test-api', message: 'Test log entry 3', requestId: randomUUID() },
  ];

  for (const log of logs) {
    await db.log.create({
      data: {
        ...log,
        timestamp: new Date(),
        metadata: { test: true },
      },
    });
  }

  console.log('✅ Generated test logs');
  return new Response('Test logs generated successfully');
}
