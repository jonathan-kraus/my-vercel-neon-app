import { neon } from '@neondatabase/serverless';
import { createLogger } from './utils/logger';
import { generateUUID } from '../uuidj';

console.log('DB module loaded');
export async function checkDbConnection() {
  const requestId = generateUUID();
  if (!process.env.DATABASE_URL) {
    return 'No DATABASE_URL environment variable';
  }
  try {
    const log = createLogger('db.ts', requestId);
    await log.info('dbts checker', { action: 'checkDbConnection' });

    const sql = neon(process.env.DATABASE_URL);
    const result = await sql`SELECT version()`;
    const countUser = await sql`SELECT COUNT(*)::int as count FROM "User"`;
    await log.info('Database connection successful', {
      pgVersion: result[0].version,
      userCount: countUser[0].count,
    });
    console.log('Pg version result:', JSON.stringify(result, null, 2));

    return 'Database connected';
  } catch (error) {
    console.error('Error connecting to the database:', error);
    return 'Database not connected';
  }
}
