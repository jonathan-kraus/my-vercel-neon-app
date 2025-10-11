
import ClientLogs from '@/app/components/ClientLogs';
import { db } from '@/app/lib/db';

export default async function LogsPage() {
  const rawLogs = await db.log.findMany({
    orderBy: { timestamp: 'desc' },
    take: 100,
  });

  const logs = rawLogs.map((log) => ({
    ...log,
    timestamp: log.timestamp.toISOString(), // ✅ Convert Date to string
  }));

  return <ClientLogs logs={logs} />;
}