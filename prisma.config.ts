import { defineConfig, env } from 'prisma/config';

// The `prisma/config` helpers are used here to define CLI settings
// and safely load environment variables for the Prisma CLI.

export default defineConfig({
  // The 'engine' property is now required in prisma.config.ts in v7.
  // 'classic' uses the traditional Rust engine for the CLI/migrations.
  engine: 'classic',

  // The database connection URL for CLI/migration commands is now defined here.
  // This replaces the `url = env("DATABASE_URL")` line in schema.prisma.
  datasource: {
    url: env('DATABASE_URL'),
    // If you were using Prisma Accelerate, you might define
    // `accelerateUrl: env('PRISMA_ACCELERATE_URL')` here for migrations.
  },

  // This is a placeholder for future configuration options,
  // ensuring the file is structured correctly for Prisma 7.0+.
  migrations: {
    // You can customize the migrations folder path here if needed.
    // path: 'prisma/migrations',
  },
});
