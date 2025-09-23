<!--
Repository-specific Copilot/AI instructions.
Keep this short (20-50 lines). Focus on discoverable patterns, important files, and commands.
-->
# Copilot instructions for this repository

This Next.js + Prisma + Neon demo app has a small, opinionated layout and a few patterns that matter when editing or adding code. Follow these concise, actionable rules so AI agents remain productive and consistent.

- Big picture
  - App Router (Next.js `app/`) with server components. See `app/page.tsx` and `app/layout.tsx`.
  - Prisma ORM for the canonical data model: `prisma/schema.prisma` (models: `User`, `Post`).
  - Neon connection helper in `app/db.ts` (uses `@neondatabase/serverless` for quick checks). Prisma uses `DATABASE_URL` from env.
  - API route handlers live under `app/api/*` and use Next.js Route Handlers (example: `app/api/authors/route.ts`).
  - A generated Prisma client exists under `app/generated/prisma/` — changes to Prisma schema require running `prisma generate`.

- Important files to reference when editing
  - `app/page.tsx` — server actions (`'use server'`), `PrismaClient` usage, `revalidatePath` and `redirect` patterns. If modifying form handlers, preserve `use server` semantics.
  - `app/db.ts` — small Neon-based health check helper; used for display and diagnostics in `app/page.tsx`.
  - `prisma/schema.prisma` — source of truth for DB shapes. Migrations are in `prisma/migrations/`.
  - `app/utils/email.ts` — sends mail via Resend and expects `RESEND_API_KEY` env var.
  - `app/generated/prisma/` — generated client/runtime present in repo; confirm or regenerate after schema changes.
  - `package.json` — dev scripts: `npm run dev` (Next dev with turbopack), `npm run build`, and `postinstall` runs `prisma generate`.

- Environment & secrets
  - Required env vars discovered in project: `DATABASE_URL`, `RESEND_API_KEY`. README suggests copying `.env.example` -> `.env`.

- Patterns & conventions (do not change without explicit review)
  - Server actions: form handlers in `app/page.tsx` use `async function createPost(formData: FormData) { 'use server'; ... }`. Keep these as server-only code.
  - Prisma usage: code instantiates `new PrismaClient()` inline in route handlers and server actions (several places in `app/page.tsx` and `app/api/*`). Follow the existing pattern when adding handlers (avoid introducing new global singletons unless you update all places intentionally).
  - Rendering: some files export `export const dynamic = "force-dynamic";` to enforce server-rendered behavior — preserve that when editing pages that depend on live DB data.
  - Error handling and responses: API route handlers return `NextResponse.json(...)` and log errors to console. Mirror this style in new route handlers.

- Tooling & workflows (how to run and validate changes)
  - Install: `npm install` (postinstall triggers `prisma generate`). If Prisma client is missing, run `npx prisma generate`.
  - Dev: `npm run dev` — opens Next.js at http://localhost:3000. Hot reload works for `app/` files.
  - Build: `npm run build` then `npm run start` to test production behavior.
  - DB: schema changes -> add migration in `prisma/migrations/` and run `npx prisma migrate dev` (or as your environment requires), then `prisma generate`.

- Integration points to be aware of
  - Neon: `@neondatabase/serverless` is used for quick SQL checks (`app/db.ts`) while Prisma is the ORM layer. `DATABASE_URL` drives Prisma.
  - Resend: email sending lives in `app/utils/email.ts` and requires `RESEND_API_KEY`.
  - Vercel-specific features: `@vercel/analytics`, `@vercel/speed-insights`, and `@vercel/blob` are present; deployments assume Vercel environment.

- Quick examples (when editing)
  - To add a route that reads posts: mirror `app/api/authors/route.ts` and return `NextResponse.json(data)` on success, `{ status: 500 }` on error.
  - To add a server action form: follow `createPost` in `app/page.tsx` — accept `FormData`, create Prisma record, call `revalidatePath('/')` and `redirect('/')` as needed.

If anything in this file is unclear or you need additional conventions (testing, lint rules, environment examples), tell me which area to expand and I will iterate.
