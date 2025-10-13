import { neon } from "@neondatabase/serverless";
import { db } from "./lib/db";


console.log("DB module loaded");
export async function checkDbConnection() {
  const requestId = crypto.randomUUID();
  if (!process.env.DATABASE_URL) {
    return "No DATABASE_URL environment variable";
  }
  try {
    await db.log.create({
  data: {
    requestId,
    message: 'dbts checker',
    severity: 'info',
    source: 'db.ts',
  },
});

    const sql = neon(process.env.DATABASE_URL);
    const result = await sql`SELECT version()`;
    
    console.log("Pg version:", result);

    return "Database connected";
  } catch (error) {
    console.error("Error connecting to the database:", error);
    return "Database not connected";
  }
}
