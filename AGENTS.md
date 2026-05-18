<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This repo uses Next.js 16.2.6 with React 19. APIs, conventions, and file structure may differ from training data. Read the relevant guide in `node_modules/next/dist/docs/` before changing Next.js code.
<!-- END:nextjs-agent-rules -->

## Commands

- Use npm only: `packageManager` is `npm@11.4.2` and `package-lock.json` is the lockfile. Do not re-add `pnpm-lock.yaml`.
- Dev server: `npm run dev`.
- Production verification: `npm run build`.
- Focused typecheck when needed: `npx tsc --noEmit`. There is no lint or test script in `package.json`.
- Data refresh scripts: `npm run ingest:dipres`, `npm run ingest:minsal`, or `npm run ingest`. They rewrite `data/*.json`; inspect `git diff data/` afterward.

## App Shape

- Main UI entrypoint is `src/app/page.tsx`, which renders `src/components/SearchClient.tsx` with data from `src/lib/search.ts`.
- API routes are `src/app/api/search`, `src/app/api/heroes`, and `src/app/api/chat`.
- Static data is imported through `@data/*`; this alias exists in both `tsconfig.json` and `next.config.ts` Turbopack `resolveAlias`.
- `MINIMAX_API_KEY` is server-only for `/api/chat`. Without it, chat returns 503 but search/data/UI should still work.

## Data Rules

- Preserve `CLAUDE.md` rule #1: no invented, estimated, interpolated, or rounded public-health figures. Official source or `null` with reason.
- Any real value or intentional `null` in `data/` must be traceable in `data/_data_audit.md`.
- `data/mapping.json` is the search map from hospital/comuna to `servicio_salud_id`; do not change keys casually because `data/dipres_ejecucion.json`, `data/minsal_espera.json`, and search results depend on them.
- DIPRES numbers live in `data/dipres_ejecucion.json.servicios` by Servicio de Salud.
- MINSAL numbers live in `data/minsal_espera.json.servicios` by Servicio de Salud. `data/minsal_espera.json.establecimientos` is only hospital-to-service metadata for search display.
- Visible UI source links should use stable home URLs (`https://www.dipres.gob.cl/`, `https://www.listaesperasalud.cl/`). Deep download URLs belong in `data/_data_audit.md` or `url_fuente_real`, not as public badges.

## Styling Gotchas

- Tailwind is v4 through `@tailwindcss/postcss`; there is no `tailwind.config.*`.
- Global tokens and custom animations live in `src/app/globals.css`, and `src/app/layout.tsx` must import that file.
- The current intended design is a dark hero with the K-milla logo, search box, national stats, and rounded result cards. If the app appears mostly unstyled or white after a merge, first restart `npm run dev`, clear stale `.next` output if necessary, and confirm `npm run build` still compiles `globals.css`.
