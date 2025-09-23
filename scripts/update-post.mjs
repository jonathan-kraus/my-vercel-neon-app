/*
  Usage (PowerShell):
    node ./scripts/update-post.mjs --id=21 --title="New Title"

  This script is intended for local/dev usage only. It performs a one-off
  Prisma post update. Do not run this in production unless you know what
  you're doing and have appropriate backups.
*/
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function parseArgs() {
  const args = {};
  for (const arg of process.argv.slice(2)) {
    const m = arg.match(/^--([^=]+)=(.*)$/);
    if (m) args[m[1]] = m[2];
  }
  return args;
}

async function main() {
  const args = parseArgs();
  const id = Number(args.id);
  const title = args.title;

  if (!id || !title) {
    console.error('Usage: node ./scripts/update-post.mjs --id=<postId> --title="New Title"');
    process.exit(1);
  }

  try {
    const updated = await prisma.post.update({
      where: { id },
      data: { title },
    });
    console.log('Updated post:', updated);
  } catch (err) {
    console.error('Error updating post:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
