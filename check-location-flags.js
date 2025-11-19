const { PrismaClient } = require('@prisma/client');

async function checkFlags() {
  const prisma = new PrismaClient();
  try {
    const flags = await prisma.featureFlag.findMany({
      where: { category: 'location' },
      select: { name: true, enabled: true },
      orderBy: { name: 'asc' },
    });
    console.log('Location Feature Flags:');
    flags.forEach((f) => console.log(`  ${f.name}: ${f.enabled}`));
  } finally {
    await prisma.$disconnect();
  }
}

checkFlags();
