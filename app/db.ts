import { neon } from "@neondatabase/serverless";

export async function checkDbConnection() {
  if (!process.env.DATABASE_URL) {
    return "No DATABASE_URL environment variable";
  }
  try {
    const requestId = crypto.randomUUID();
    const sql = neon(process.env.DATABASE_URL);
    const result = await sql`SELECT version()`;
    const j = await sql`INSERT INTO public."Log" (requestId, message, severity, source) VALUES (${requestId}, 'Log entry', 'INFO', 'System')`;
    console.log("Pg version:", result);
    console.log("Insert result:", j);
    return "Database connected";
  } catch (error) {
    console.error("Error connecting to the database:", error);
    return "Database not connected";
  }
}
