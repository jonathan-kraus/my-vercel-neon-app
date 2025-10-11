import { PrismaClient } from '@prisma/client';
import ClientLogs from '@/app/components/ClientLogs';

const prisma = new PrismaClient();

export default async function LogsPage() {
  const rawLogs = await prisma.log.findMany({
    orderBy: { timestamp: 'desc' },
    take: 100,
  });

  const logs = rawLogs.map((log) => ({
    ...log,
    timestamp: log.timestamp.toISOString(), // ✅ Convert Date to string
  }));

  return <ClientLogs logs={logs} />;
}