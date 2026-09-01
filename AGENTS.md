# AGENTS.md — KT FOCAS Calculator

> Instructions for AI agents working in this repo. Keep this file concise and update it when conventions change.

## Overview

KT FOCAS Calculator is a Kill Team 2026 odds calculator — single guided Wizard flow, inspired by https://ktcalc.com (open source https://github.com/jfreal/ktcalc). Exact-enumeration probability engine, operative presets from JSON. Live at https://Rassell.github.io/kt-focas-calculator/ via GitHub Pages.

## Tech Stack

- Vite 8 + React 19 + TypeScript 6 + React Compiler (Babel) + React Router 7 (`/wizard` only) + Tailwind CSS 4
- No other extra runtime deps (no recharts). Pure React + Tailwind.
- ESLint flat config (`eslint.config.js`), `tsc -b` for type checking.
- GitHub Pages project site: `vite.config.ts` `base: '/kt-focas-calculator/'`, `BrowserRouter basename={import.meta.env.BASE_URL}`.
- PWA: `public/manifest.webmanifest` + `public/sw.js` + icons (`icon-192.png`, `icon-512.png`, `icon-512-maskable.png`, `apple-touch-icon.png`); `index.html` links manifest/apple-touch-icon/theme-color; `src/main.tsx` registers SW in prod only; `src/components/InstallBanner.tsx` (mobile-only banner).

## Project Structure

```
src/
  App.tsx                 # Shell: topbar, help, Routes (/wizard), footer + InstallBanner
  index.css               # Design tokens (light/dark), base typography (Tailwind)
  main.tsx                # StrictMode + createRoot + BrowserRouter basename=BASE_URL + SW register (prod)
  components/
    InstallBanner.tsx     # Mobile install banner (beforeinstallprompt + iOS fallback, 7-day snooze)
    layout/               # AppHeader, AppFooter
    stats/ + wizard/ + ui/# Stats, wizard steps, shared UI
  pages/wizard/           # ModeStep, AttackerStep, DefenderStep, StatsStep, Layout, shared
  data/
    operatives.json       # Predefined operatives: { shoot, fight, defender } per entry
    operatives.ts         # Types/helpers
  engine/
    calculator.ts         # Probability engine (see below)
  hooks/ + types/         # useWizardParams, useFilteredOperatives, operative types
public/
  favicon.svg
  manifest.webmanifest    # PWA manifest (standalone, icons, theme_color)
  sw.js                   # Service worker (network-first navigations, cache-first assets)
  icon-192.png / icon-512.png / icon-512-maskable.png / apple-touch-icon.png
.github/workflows/deploy.yml  # Pages deploy (build → 404.html SPA fallback → deploy-pages)
index.html, vite.config.ts, tsconfig.*.json
```

## Commands

```bash
npm run dev      # Vite dev server (HMR) — base = /
npm run build    # tsc -b && vite build — base = /kt-focas-calculator/ for Pages
npm run lint     # eslint .
npm run preview  # vite preview (after build)
```

`npm start` is not defined — use `npm run dev`.

## Deployment — GitHub Pages

- Project site at `https://Rassell.github.io/kt-focas-calculator/` (repo `Rassell/kt-focas-calculator`, branch `main`).
- `vite.config.ts` `base: '/kt-focas-calculator/'` — required for project sites (`https://<user>.github.io/<repo>/`). For a user/org site use `'/'`.
- `src/main.tsx` `BrowserRouter basename={import.meta.env.BASE_URL}` — route `/wizard` works under subpath; dev stays at `/`.
- `.github/workflows/deploy.yml` — on `push` to `main` + `workflow_dispatch`: `npm ci` → `npm run build` → `cp dist/index.html dist/404.html` (SPA fallback for deep links) → `configure-pages` → `upload-pages-artifact` → `deploy-pages`. Requires Settings → Pages → Source: `GitHub Actions`.
- When adding routes, keep SPA fallback (`404.html`) and `basename` in mind; test `npm run build && npm run preview` and check `dist/index.html` asset paths include `/kt-focas-calculator/`.
- PWA assets in `public/` (`manifest.webmanifest`, `sw.js`, `icon-*.png`, `apple-touch-icon.png`) are copied to `dist/` by Vite; verify `dist/manifest.webmanifest` and `dist/sw.js` exist and `dist/index.html` links manifest/theme-color/apple-touch-icon.

## Engine — `src/engine/calculator.ts`

- **Types**: `Attacker` (attacks, bs 2-6, normalDmg, critDmg, devastating, piercing, piercingCrits, reroll, lethal, accurate, rending, severe, punishing, rounds), `Defender` (save 2-6, wounds, indomitus, jasCrits, jasNormals), `Situation` (`attacker`, `defender`, `coverSaves`, `obscured` situational checks), `CalcResult` (avgDamage, injuryChance, killChance, dmgProbs, histogram).
- **Reroll**: `none | balanced | relentless | ceaseless | balanced-ceaseless`. Ceaseless handled via `effectiveDieProbs` (reroll 1s); Balanced/Relentless via enumeration in `attackerDistribution`.
- **Attacker abilities** in `applyAbilities`: Accurate (retain fails as normals), Punishing (retain one fail), Severe (no crits → norm→crit), Rending (≥1 crit → norm→crit).
- **Situation checks**: `coverSaves` (auto-block X hits, prefer crits if critDmg > normalDmg) and `obscured` (crits→normals) applied in `calcDmgProbs` before defender saves. Defender saves via `saveProb` (AP worsens save, Indomitus ignores AP), binomial enumeration, Devastating (MW per crit before saves), JaS (ignore one crit/normal).
- **Rounds**: convolution of `dmgMap` with itself.
- **Exports**: `calcDmgProbs(sit)`, `calcResult(sit)`, `combinedKillChance(s1,s2,wounds)`, `defaultAttacker()`, `defaultDefender()`, `defaultSituation()`.
- **Math**: `multinomialProb` (N!/(c!n!f!) * p^c...), `binomialProb`, `dieProbs`/`effectiveDieProbs`.

When editing the engine: keep exact enumeration (no Monte Carlo), ensure `dmgProbs` sums to 1, run `npm run build` to catch TS errors.

## UI — `src/App.tsx` + `src/pages/wizard/`

- `pages/wizard/` — 4-step flow: `ModeStep` → `AttackerStep` → `DefenderStep` → `StatsStep` (via `WizardLayout` + `shared.tsx` + `useWizardParams`). Attacker/defender pick from `operatives.json` (`shoot`/`fight`/`defender` profiles per mode); stats uses `calcResult` → avg/injury/kill + histogram + exact probs. Components in `src/components/wizard/` and `src/components/stats/`.
- `App` — shell: topbar, help, `Routes` (`/`→`/wizard`, `/wizard`, `*`→`/wizard`), footer, `InstallBanner` (mobile-only). No other pages.
- `InstallBanner` (`src/components/InstallBanner.tsx`) — fixed bottom, `md:hidden`, safe-area inset; listens for `beforeinstallprompt` (Android/Chrome) with Install button (`prompt()` + `userChoice`), iOS fallback (Share → Add to Home Screen hint after 1.2s), hidden when `display-mode: standalone` or `navigator.standalone`, 7-day snooze via `localStorage` (`pwa-install-banner-dismissed`), handles `appinstalled`.
- Routing via `react-router-dom` `BrowserRouter` with `basename={import.meta.env.BASE_URL}` (see `main.tsx`); SW registered in `main.tsx` on `load` when `import.meta.env.PROD`.

## Styling — `src/index.css` (Tailwind)

- Dark topbar (`#0f1117`), wizard progress dots, mode cards, operative grid, summary vs layout, histogram bars (`#6366f1`).
- Keep `index.css` tokens for light/dark. Tailwind via `@tailwindcss/vite`. Prefer Tailwind/CSS over new deps.

## Conventions

- Use `replace_string_in_file` with 3-5 lines context; prefer `insert_edit_into_file` only if replace fails.
- Never print codeblocks for file changes — use edit tools. Never run terminal edits for files.
- After edits, run `npm run build` and `npm run lint`; fix errors before finishing.
- Keep bundle small — avoid adding deps without need.

## Adding Features

- New operative: add entry to `src/data/operatives.json` with `shoot`/`fight`/`defender` fields matching `Attacker`/`Defender` types.
- New attacker/defender rule: extend type in `calculator.ts`, handle in `attackerDistribution` or `calcDmgProbs`, expose in wizard summary if needed.
- New view: add component in `App.tsx` or `pages/`, style in `App.css`, memoize calculations.
- Tests: `vitest` + `jsdom` + `@testing-library/react` (see `vite.config.ts` `test`); run `npm test` / `npm run test:coverage`.
- PWA: icons generated from `src/assets/foca.png` via `sips --padToHeightWidth` → `sips -z` (512/192/180); manifest `start_url`/`scope` must match `base`; SW cache `kt-focas-v1` (network-first navigations, cache-first assets).

## Verification

1. `npm run build` passes (tsc + vite) — check `dist/manifest.webmanifest`, `dist/sw.js`, `dist/icon-*.png` exist
2. `npm run lint` passes
3. `npm test` passes (116 tests)
4. Manual: wizard flow mode → attacker → defender → stats shows correct avg/injury/kill + histogram; on mobile, install banner appears (dismiss snoozes 7 days, hidden when installed)
