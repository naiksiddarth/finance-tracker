# AGENTS.md

This is an npm-workspaces monorepo orchestrated by Turborepo. Apps: `web` (Vite + React 19 + Tailwind v4) and `api` (Express 5 + Mongoose). Shared packages: `@finance-tracker/db` and `@workspace/ui`.

## Commands

- Root scripts run across all workspaces via Turbo: `npm run build`, `npm run dev`, `npm run lint`, `npm run format`, `npm run typecheck`.
- Run a command for one package: `npx turbo <task> --filter <pkg>` (e.g. `npx turbo dev --filter web`).
- There is **no test framework** and **no CI** configured yet. Run `typecheck`/`lint` as the verification step.

## Package manager: use npm, not pnpm

`package.json` declares `"packageManager": "npm@11.8.0"` and uses npm workspaces. The README's `pnpm dlx shadcn ...` command is stale — use npm equivalents (e.g. `npx shadcn@latest add button -c apps/web`).

## Workspace package conventions

- `@finance-tracker/db` is consumed as **TypeScript source** (`main`/`exports` point at `src/*.ts`), not a built artifact. Do not expect a `dist` build; `api` imports models directly from source.
- `@workspace/ui` holds shadcn/ui components. New components are added by pointing the shadcn CLI at `apps/web` (which has its own `components.json`), and they are written into `packages/ui/src/components`. Its `components.json` uses style `base-nova` (Base UI, not Radix) with `lucide` icons.
- `web` uses the `@` alias → `apps/web/src` (see `vite.config.ts`).

## Toolchain quirks

- **Prettier is non-default**: `semi: false`, `singleQuote: false` (double quotes), and `prettier-plugin-tailwindcss` reorders Tailwind classes. Run `npm run format` rather than ad-hoc formatting.
- **Tailwind v4** is CSS-first via `@tailwindcss/vite` — there is no `tailwind.config.js`. Global styles live at `packages/ui/src/styles/globals.css`.
- `web` build is `tsc -b && vite build`; `api` dev is `tsx watch src/index.ts` and listens on port **2131**.
- Requires Node >= 20. TypeScript is `~6` (bleeding edge).
- Turbo caches task outputs; `dev` is persistent and uncached.
