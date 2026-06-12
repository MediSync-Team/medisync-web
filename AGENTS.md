# This is NOT the Next.js you know

Next.js 16.2 has breaking changes. Read the relevant guide in `node_modules/next/dist/docs/` before writing code. Heed deprecation notices.

## Quick start
- `npm install`
- `npm run dev` → http://localhost:3000

## Exact commands
| Script | What it does |
|--------|--------------|
| `npm run dev` | Next dev server |
| `npm run build` | `next build --webpack` |
| `npm run lint` | `eslint` (config: `eslint-config-next` core-web-vitals + typescript) |
| `npm run test` | Vitest (JSDOM) |
| `npm run test:watch` | Vitest watch |
| `npm run test:ui` | Vitest UI |
| `npm run clean:cf` | Prep Cloudflare build |
| `npm run build:cf` | `clean:cf` + `opennextjs-cloudflare build` |
| `npm run preview:cf` | `clean:cf` + build + preview |
| `npm run deploy:cf` | `clean:cf` + build + deploy |
| `npm run purge:build-trash` | Cleanup script |
| `npm run purge:build-trash:dry` | Dry-run cleanup |

## Deployment (Cloudflare Workers)
- `@opennextjs/cloudflare`
- `wrangler.jsonc` sets `main: .open-next/worker.js`, `compatibility_flags: nodejs_compat, global_fetch_strictly_public`, assets binding to `.open-next/assets`, `WORKER_SELF_REFERENCE` service binding.
- `open-next.config.ts` is default (no overrides enabled).

## Runtime config
- API base: `NEXT_PUBLIC_API_URL` (fallback `http://localhost:4000/api`) in `app/lib/api.ts`.
- Push: `NEXT_PUBLIC_VAPID_PUBLIC_KEY` in `.env.production.example`.

## App structure (App Router)
- `app/page.tsx` — home (especialidades + profesionales, filters, pagination, onboarding tour).
- `app/auth/`, `app/login/`, `app/register/`, `app/forgot-password/`
- `app/dashboard/` with `admin/`, `clinica/`, `paciente/`
- `app/profesional/[id]/` — public professional profile
- `app/pago/`, `app/pago-exitoso/`, `app/pago-fallido/`, `app/pago-pendiente/`
- `app/invitacion/`
- `app/widget/` — embeddable widget pages
- `app/api/pagos/webhook/` — payment webhook proxy (forwards to `INTERNAL_API_URL` or `NEXT_PUBLIC_API_URL`)

## Quirks
- **Widget iframe headers**: `next.config.ts` sets `X-Frame-Options: ALLOWALL` and `frame-ancestors *` for `/widget/:path*`.
- **Tailwind v4** via `@tailwindcss/postcss` plugin (`postcss.config.mjs`), not v3.
- **Tests**: Vitest + Testing Library + JSDOM. Setup file: `src/test/setup.ts`. Includes `src/**/*.{test,spec}.*` and `app/__tests__`.
- **Public**: `public/sw.js` (service worker).

## Layout
- Root layout (`app/layout.tsx`) sets `lang="es"` and wraps with Auth → Theme → Language → Notification providers.
