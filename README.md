# Reframe Account Manager

Fork of [techuhak/Nuvio-Account-Manager](https://github.com/techuhak/Nuvio-Account-Manager), pointed at the **Reframe / self-hosted Nuvio backend** instead of `api.nuvio.tv`.

Sign in with the same email and password as the TV app. Addons, plugins, collections, and profiles sync to Shield on the next pull.

## What changed from upstream

- Backend URL and publishable key come from env vars, not hardcoded Nuvio Cloud credentials
- Push RPCs send `p_origin_client_id` (required by this backend)
- Library restore uses `sync_push_library_items`
- Profile rename uses `sync_push_profiles` (direct table PATCH is not granted)
- Home includes **Reframe Studio** at `/studio` (same deploy as this dashboard)

## Local run

```sh
cp .env.example .env.local
# fill NEXT_PUBLIC_NUVIO_SUPABASE_URL and NEXT_PUBLIC_NUVIO_SUPABASE_ANON_KEY
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy (Vercel)

One-click: [Import this repo on Vercel](https://vercel.com/new/import?s=https://github.com/Tolu-Walop-E/Nuvio-Account-Manager)

Set these project env vars, then deploy:

- `NEXT_PUBLIC_NUVIO_SUPABASE_URL`
- `NEXT_PUBLIC_NUVIO_SUPABASE_ANON_KEY`

Use the publishable/anon key only. Never put a service-role key in this app.

## Features

Same as upstream: account cloning, addon/plugin management, collections builder, Stremio migrate, backup/restore.

Upstream README: https://github.com/techuhak/Nuvio-Account-Manager
