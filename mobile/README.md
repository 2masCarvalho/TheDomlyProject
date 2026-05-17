# Domly — Mobile (Residents)

Expo app for **residents** of buildings managed in the Domly web dashboard. Residents sign in with an invite code from their property manager and submit `ocorrências` (maintenance reports) directly to the existing Supabase backend.

## Stack

- Expo SDK 54 (Expo Router 6, file-based routing) · React 19 · RN 0.81
- TypeScript
- `@supabase/supabase-js` 2.81 (same project as the web app — `https://uszdiqdlwempkjqjlvaq.supabase.co`)
- `@tanstack/react-query`
- `react-hook-form` + `zod`
- Plain React Native StyleSheet (no NativeWind — keeps the Expo SDK 54 / React 19 dep graph simple)
- `expo-image-picker` + `expo-camera`

## Setup

**One-off (before the first run):**

1. Apply the resident-scope migration on your Supabase project. Either:
   - Paste `supabase/migrations/20260516_ocorrencias_resident_scope.sql` into the Supabase SQL editor, or
   - `supabase db push` if the Supabase CLI is linked to a dev branch.
2. Install mobile deps:
   ```sh
   npm run mobile:install   # cd mobile && npm install
   ```
   If npm warns about peer deps, run `npx expo install --check` inside `mobile/` to align versions.

**Day-to-day:**

```sh
npm run mobile:dev          # cd mobile && expo start
npm run mobile:ios          # iOS simulator
npm run mobile:android      # Android emulator
```

Or directly inside `mobile/`:

```sh
npm install
npx expo start
```

## Architecture notes

- The Supabase URL and anon key are **hardcoded** in `mobile/lib/supabase.ts` to match the web app's `src/supabase-client.ts`. Env-var migration is a separate task tracked for both web + mobile together.
- The mobile app does NOT import from `../src`. Web and mobile have separate module resolvers (Vite vs Metro). The small set of api modules and helpers we need (ocorrencias, memberships, ocorrenciaAutofill) is mirrored into `mobile/lib/`.
- Resident role is implicit — there is no `role` column on the `users` table. A user is a resident when they have a row in `condominio_memberships` with `role='residente'`. The web app's invite-token flow assigns that role.
- The `ocorrencia-fotos` storage bucket and `condominios/{id}/{file}` path convention are shared with the web app, so photos uploaded from the mobile app render in the web dashboard with zero changes.
- Photo upload on RN uses `FormData` with a `{ uri, name, type }` shape (Supabase JS can't consume a `File` on RN). See `mobile/lib/api/ocorrencias.ts:uploadPhoto`.

## Smoke test

1. On the web app (gestor), create an invite token for a building. Copy the 32-char hex token.
2. Open Domly mobile, sign up with a new email, and confirm the email.
3. Sign in → you land on `/join`. Paste the token → see the building name → "Aceitar convite".
4. Tap **Nova**, fill in a title (e.g. "Fuga de água no elevador"), add a photo, submit.
5. Confirm the report appears in the web `/ocorrencias` view within seconds, with the photo rendering correctly.

## Known follow-ups (out of MVP)

- **Unit/fracção tracking.** Residents currently can't say "I'm apartment 4B" — needs a `fracoes` table + `condominio_memberships.id_fracao` FK.
- **Push notifications** on status change. Needs Expo push tokens + an Edge Function that fires on `ocorrencias.estado` change.
- **Env-var migration** for both web and mobile (Supabase URL/key currently hardcoded in two places).
- **Real-time updates** via Supabase channels (currently TanStack refetch-on-focus + pull-to-refresh).
