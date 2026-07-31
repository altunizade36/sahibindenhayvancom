---
name: Vercel + Supabase Deployment
description: Architecture decisions and key changes made for independent Vercel+Supabase deployment
---

## What was set up

Multi-provider storage: objectStorage.ts checks `isSupabaseStorageConfigured()` at startup.
- If `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` set → uses `server/supabaseStorage.ts`
- Otherwise → falls back to Replit GCS sidecar (unchanged behavior)

Replit Auth made optional: `server/replitAuth.ts` `setupAuth()` now skips OIDC strategy setup if `REPL_ID` is not set. Email/phone auth still works in all environments.

WebSocket made optional: `server/routes.ts` checks `VERCEL=1` or `DISABLE_WEBSOCKET=true`. Sets `wss` to `null` in serverless environments; all wss usages use optional chaining (`wss?.`).

## Key files added
- `server/supabaseStorage.ts` — Supabase Storage provider (same interface as Replit storage)
- `server/vercel-entry.ts` — Express app entry for Vercel serverless
- `api/handler.ts` — re-exports vercel-entry handler (Vercel function entrypoint)
- `vercel.json` — Vercel routing config
- `.env.example` — all required env vars documented in Turkish
- `DEPLOY.md` — step-by-step Supabase + Vercel deployment guide
- `.gitignore` — standard Node.js gitignore

## WebSocket limitation on Vercel
Features not working on Vercel (WebSocket required):
- Real-time auction bids
- Instant messaging WebSocket
- Farm TV live streaming
- Online presence indicator

**Alternative**: Deploy backend to Railway (full WebSocket support) with same env vars.

**Why:** Vercel serverless functions are stateless; persistent WebSocket connections cannot be maintained across function instances.

## Required env vars for Vercel
DATABASE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_STORAGE_BUCKET,
SESSION_SECRET, RESEND_API_KEY, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY,
RECAPTCHA_SECRET_KEY. Redis (Upstash) is optional.
