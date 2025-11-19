[![CI](https://github.com/jonathan-kraus/my-vercel-neon-app/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/jonathan-kraus/my-vercel-neon-app/actions/workflows/ci.yml)

![Vercel with Neon](./assets/home.png)

-> View demo: [vercel-marketplace-neon.vercel.app](https://vercel-marketplace-neon.vercel.app/)

# Neon Postgres

A minimal template for building full-stack React applications using Next.js, Vercel, and Neon.

## Getting Started

Click the "Deploy" button to clone this repo, create a new Vercel project, setup the Neon integration, and provision a new Neon database:

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fneondatabase-labs%2Fvercel-marketplace-neon%2Ftree%2Fmain&project-name=my-vercel-neon-app&repository-name=my-vercel-neon-app&products=[{%22type%22:%22integration%22,%22integrationSlug%22:%22neon%22,%22productSlug%22:%22neon%22,%22protocol%22:%22storage%22}])

Once the process is complete, you can clone the newly created GitHub repository and start making changes locally.

## Local Setup

### Installation

Install the dependencies:

```bash
npm install
```

You can use the package manager of your choice. For example, Vercel also supports `bun install` out of the box.

### Development

#### Create a .env file in the project root

```bash
cp .env.example .env
```

#### Get your database URL

Obtain the database connection string from the Connection Details widget on the [Neon Dashboard](https://console.neon.tech/).

#### Add the database URL to the .env file

Update the `.env` file with your database connection string:

```txt
# The connection string has the format `postgres://user:pass@host/db`
DATABASE_URL=<your-string-here>
```

#### Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more about Neon, check out the Neon documentation:

- [Neon Documentation](https://neon.tech/docs/introduction) - learn about Neon's features and SDKs.
- [Neon Discord](https://discord.gg/9kf3G4yUZk) - join the Neon Discord server to ask questions and join the community.
- [ORM Integrations](https://neon.tech/docs/get-started-with-neon/orms) - find Object-Relational Mappers (ORMs) that work with Neon.

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Deploy on Vercel

Commit and push your code changes to your GitHub repository to automatically trigger a new deployment.

## Developer notes (local/dev workflows)

This project uses Next.js App Router + Prisma (Neon Postgres). The following notes document a few repository-specific patterns and the dev tools added to make one-off DB updates safe.

Required env vars

- `DATABASE_URL` — Postgres connection string used by Prisma.
- `RESEND_API_KEY` — required by `app/utils/email.ts` if you use the email helpers.

Local dev quick start

1. Install dependencies (Postinstall runs `prisma generate`):

```bash
npm install
```

2. (Optional) regenerate Prisma client if you changed the schema:

```bash
npx prisma generate
```

3. Start dev server:

```bash
npm run dev
```

One-off post update script (safe local use)

We intentionally avoid running DB writes from modules under `app/` (build-time or module evaluation can run on Vercel). For controlled one-off updates use the CLI script:

```powershell
# Example (PowerShell)
node ./scripts/update-post.mjs --id=21 --title="New Title"
```

Dev-only API and UI

For convenience there's a guarded dev API and a small UI:

- `POST /api/dev/update-post` — accepts JSON `{ id, title }` and updates a post. This route returns 403 when `NODE_ENV === 'production'` to prevent accidental production writes.
- Dev UI at `/dev/update-post` — simple browser form that POSTs to the above API. The link is also available from the site-side navigation under "Dev → Update Post (dev)".

Side nav

The site now contains a simple left `SideNav` (`app/components/SideNav.tsx`) that appears on large screens. It includes quick links to Home, Posts by User, the Authors API and the Dev page.

Post-count badges

- A small reusable component `app/components/PostCountBadge.tsx` renders each user's post count.
- `app/page.tsx` and `app/pstbyusr/page.tsx` use badges to show counts next to authors.
- The authors API at `app/api/authors/route.ts` now returns `_count.posts` so client components don't have to make extra queries.

Why we avoid DB writes at module scope

- Next.js (and Vercel) evaluate `app/` modules at build or server-init time. Any top-level `await` or DB write will execute during build and can mutate production data unexpectedly. This repository previously contained such a top-level update; it has been removed and replaced with safe alternatives above.

Prisma migration guidance

- If you do not change `prisma/schema.prisma` you do not need to run a migration.
- When schema changes are required:
  - Create a migration in development:

  ```powershell
  npx prisma migrate dev --name add-thing
  npx prisma generate
  ```

  - Commit the migration folder in `prisma/migrations/` and apply it in CI or production using:

  ```powershell
  npx prisma migrate deploy --schema=prisma/schema.prisma
  ```

  - Never run `prisma migrate dev` directly against a production database.

Publish / build notes

- Vercel sets `NODE_ENV=production` by default; guarded dev routes will refuse to run in production.
- Deployments run `npm run build` which executes `next build` and will fail if server code contains invalid imports or top-level errors. Keep `app/` modules side-effect-free.

Security notes and optional hardening

- The dev API route is guarded by `NODE_ENV`. For stricter protection you can add an extra token check (e.g., `DEV_SAFE_TOKEN` env var) or require request headers.
- Consider adding an ESLint rule to disallow top-level Prisma writes in `app/` files. If you'd like, I can add an example ESLint configuration that flags `await` or `prisma` usage in module scope.

If you want these dev tools documented further (or prefer the dev updater to require a token), tell me which option you prefer and I will update the README and implement the guard.

## Feature Flags

This project uses a database-backed feature flag system that works seamlessly on both client and server:

### How it works

- **Database-backed**: All feature flags are stored in the `FeatureFlag` table with a 60-second server-side cache
- **No redeploy needed**: Toggle flags instantly via the admin UI at `/admin/feature-flags`
- **Client and server**: Both environments read from the same database source
- **Environment variable fallback**: If database is unavailable, falls back to `FEATURE_*` env vars

### Managing flags

Visit `/admin/feature-flags` to:

- View all feature flags grouped by category
- Toggle flags on/off with instant effect
- See flag descriptions and last update time

Changes take effect immediately:

- Server routes pick up changes within 60 seconds (cache TTL)
- Client components get updates on next page load or fetch

### Using flags in code

**Server-side (API routes, server components):**

```typescript
import { isFeatureEnabled } from '@/app/utils/featureFlags';

// Synchronous - uses cached database values
if (await isFeatureEnabled('VERBOSE_LOGGING')) {
  log.info('Detailed debug information');
}
```

**Client-side (React components):**

```typescript
import { isFeatureEnabled } from '@/app/utils/featureFlags';

// Fetches from /api/feature-flags
if (await isFeatureEnabled('DARK_MODE')) {
  return <DarkModeUI />;
}
```

### Database schema

```prisma
model FeatureFlag {
  id          Int      @id @default(autoincrement())
  name        String   @unique
  enabled     Boolean  @default(false)
  description String?
  category    String?
  updatedAt   DateTime @updatedAt
  createdAt   DateTime @default(now())
}
```

### Adding new flags

1. Add to database via seed script `prisma/seed-feature-flags.ts`
2. Run: `npx tsx prisma/seed-feature-flags.ts`
3. Update TypeScript types in `app/utils/featureFlags.ts`

### Environment variable fallback

If the database is unavailable, the system falls back to environment variables:

```bash
FEATURE_VERBOSE_LOGGING=true
FEATURE_LOG_REQUEST_TRACING=true
FEATURE_LOCATION_NEW_YORK=true
```

This provides a safety net during database outages or for local development without seeding.
if (isFeatureEnabled('DARK_MODE')) {
return <DarkModeUI />;
}

````

### Browser localStorage overrides (client-side only)

You can override flags in the browser console without restarting the server:

```javascript
// In browser console
import { setFeatureFlagOverride } from '@/app/utils/featureFlags';

// Enable a flag
setFeatureFlagOverride('VERBOSE_LOGGING', true);

// Disable a flag
setFeatureFlagOverride('DARK_MODE', false);

// Clear all overrides
import { clearFeatureFlagOverrides } from '@/app/utils/featureFlags';
clearFeatureFlagOverrides();
````

**Note**: localStorage overrides only affect client-side code. Server-side API routes and server components always read from environment variables.

### Feature flag UI

Visit `/admin/feature-flags` to view and toggle feature flags in the browser.

```

```
