// app/lib/db.ts

import 'dotenv/config';
// Use the relative path to the generated client
import { PrismaClient } from '@/prisma/generated/client';
import { PrismaNeon } from '@prisma/adapter-neon';
// 💡 This is the library you just installed
import { Pool } from '@neondatabase/serverless';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set.');
}

// 🛠️ FIX 1: Instantiate the Neon Pool client using the connection string
// This creates the object that the adapter expects.
const pool = new Pool({ connectionString });

// 🛠️ FIX 2: Pass the instantiated pool object to the Prisma adapter
const adapter = new PrismaNeon(pool);

// 🛠️ FIX 3: Pass the adapter to the Prisma Client constructor
// This correctly tells Prisma which driver to use, which prevents the
// red-herring 'accelerateUrl' error from the type system.
const prisma = new PrismaClient({
  adapter,
  // Remove the log block for now if it's causing issues, or place it here:
  // log: ['query', 'info', 'warn', 'error'],
});

// ... existing singleton logic (if any) ...

export const db = prisma;
