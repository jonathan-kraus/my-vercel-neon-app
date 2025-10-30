# Environment variables and deployment notes

This project uses a few environment variables. Copy `.env.example` to `.env` for local development and fill in values.

Key variables:

- DATABASE_URL — Postgres connection string (required)
- MAILERSEND_API_KEY — MailerSend API key (if used)
- RESEND_API_KEY — Resend API key (if used)
- NEXT_PUBLIC_SITE_URL, SITE_URL — Base URL for the app
- VERCEL_URL — provided by Vercel at runtime
- EMAIL_THROTTLE_MINUTES — How many minutes to suppress duplicate emails (default 15)

When deploying to Vercel, add the same variables in Project → Settings → Environment Variables (or use `vercel env add`).
