
import ClientLogs from '@/app/components/ClientLogs';
import { db } from '@/app/lib/db';
console.log('[build] Generating /logs');

export default async function LogsPage() {
  const rawLogs = await db.log.findMany({
    orderBy: { timestamp: 'desc' },
    take: 100,
  });

  const logs = rawLogs.map((log) => ({
    ...log,
    timestamp: log.timestamp.toISOString(), // ✅ Convert Date to string
  }));
  console.log(`[logs/page] Fetched ${logs.length} logs from DB`);
  return <ClientLogs logs={logs} />;
}