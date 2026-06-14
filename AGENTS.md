# AGENTS.md

## Cursor Cloud specific instructions

TravelDesk Pro is a single Next.js 14 (App Router) + TypeScript + Tailwind app, package-managed with **npm** (Node 18.17+; verified on Node 22). There is no separate backend service in this repo. Standard scripts live in `package.json` (`dev`, `build`, `start`, `lint`).

### Running / services
- One process only: the Next.js server. Run dev with `npm run dev` (serves http://localhost:3000). Build with `npm run build`, prod with `npm start`.
- **Two app modes, switched purely by env vars** (`src/lib/supabase.ts`, `src/middleware.ts`):
  - **No Supabase env vars set → localStorage mode.** The `/demo` workspace (e.g. `/demo/dashboard`, `/demo/customers`, `/demo/bookings`) is fully functional with no backend and persists data in the browser. This is the default in this environment and is the easiest way to exercise core features end to end.
  - **`NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` set → real multi-tenant mode** (auth, cloud persistence, RLS). This additionally requires a Supabase project with `supabase_schema.sql` applied, then the `migrations/*.sql` files applied in order, and email confirmation disabled in Supabase Auth (see `DEPLOY.md`). Without valid keys, the non-demo routes (login/signup) cannot persist.
- `firebase` is a dependency but `src/lib/firebase.ts` is fully commented out / unused. Supabase is the only real backend. Ignore Firebase for setup.

### Lint / test / build gotchas
- **`npm run lint` is NOT preconfigured**: `next lint` launches an interactive ESLint setup prompt (no `.eslintrc` exists) and will hang in non-interactive shells. Don't rely on it as a quality gate as-is.
- **There is no automated test suite** (no Jest/Vitest/Playwright config or test files, no `test` script).
- `npm run build` runs type-checking and lint-during-build, so it is the most reliable quality gate. It passes cleanly.
