import { PrismaClient } from '@prisma/client';
import ClientLogs from '@/app/components/ClientLogs';

const prisma = new PrismaClient();

export default async function LogsPage() {
  const logs = await prisma.log.findMany({
    orderBy: { timestamp: 'desc' },
    take: 100,
  });

  return <ClientLogs logs={logs} />;
}
