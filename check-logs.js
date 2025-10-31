import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function checkLogs() {
  try {
    const logs = await prisma.log.findMany({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // last 24 hours
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 10,
    });

    console.log('Recent logs:');
    logs.forEach((log) => {
      console.log(`- ${log.timestamp}: ${log.severity} - ${log.source} - ${log.message}`);
      if (log.metadata) {
        console.log(`  Metadata: ${JSON.stringify(log.metadata, null, 2)}`);
      }
    });
  } catch (err) {
    console.error('Error querying logs:', err);
  } finally {
    await prisma.$disconnect();
  }
}

checkLogs();
