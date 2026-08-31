# AGENTS.md — KT FOCAS Calculator

> Instructions for AI agents working in this repo. Keep this file concise and update it when conventions change.

## Overview

KT FOCAS Calculator is a Kill Team 2026 odds calculator (Fight + Shooting tabs), inspired by https://ktcalc.com (open source https://github.com/jfreal/ktcalc). Two side-by-side Situations, exact-enumeration probability engine, winner banner. Live at https://Rassell.github.io/kt-focas-calculator/ via GitHub Pages.

## Tech Stack

- Vite 8 + React 19 + TypeScript 6 + React Compiler (Babel) + React Router 7 (`/fight`, `/shooting`)
- No other extra runtime deps (no recharts). Pure React + CSS.
- ESLint flat config (`eslint.config.js`), `tsc -b` for type checking.
- GitHub Pages project site: `vite.config.ts` `base: '/kt-focas-calculator/'`, `BrowserRouter basename={import.meta.env.BASE_URL}`.

## Project Structure

```
src/
  App.tsx                 # Shell: topbar/nav, help, Routes (/fight, /shooting), footer
  App.css                 # Layout, panels, stepper, banner, responsive grid
  index.css               # Design tokens (light/dark), base typography
  main.tsx                # StrictMode + createRoot + BrowserRouter basename=BASE_URL
  pages/
    Fight.tsx             # Fight mode (WS label) — SituationPanel + calcResult
    Shooting.tsx          # Shooting mode (BS label) — SituationPanel + calcResult
  engine/
    calculator.ts         # Probability engine (see below)
public/
  favicon.svg
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
- `src/main.tsx` `BrowserRouter basename={import.meta.env.BASE_URL}` — routes `/fight`/`/shooting` work under subpath; dev stays at `/`.
- `.github/workflows/deploy.yml` — on `push` to `main` + `workflow_dispatch`: `npm ci` → `npm run build` → `cp dist/index.html dist/404.html` (SPA fallback for deep links) → `configure-pages` → `upload-pages-artifact` → `deploy-pages`. Requires Settings → Pages → Source: `GitHub Actions`.
- When adding routes, keep SPA fallback (`404.html`) and `basename` in mind; test `npm run build && npm run preview` and check `dist/index.html` asset paths include `/kt-focas-calculator/`.

## Engine — `src/engine/calculator.ts`

- **Types**: `Attacker` (attacks, bs 2-6, normalDmg, critDmg, devastating, piercing, piercingCrits, reroll, lethal, accurate, rending, severe, punishing, rounds), `Defender` (save 2-6, wounds, coverSaves, indomitus, obscured, jasCrits, jasNormals), `Situation`, `CalcResult` (avgDamage, injuryChance, killChance, dmgProbs, histogram).
- **Reroll**: `none | balanced | relentless | ceaseless | balanced-ceaseless`. Ceaseless handled via `effectiveDieProbs` (reroll 1s); Balanced/Relentless via enumeration in `attackerDistribution`.
- **Attacker abilities** in `applyAbilities`: Accurate (retain fails as normals), Punishing (retain one fail), Severe (no crits → norm→crit), Rending (≥1 crit → norm→crit). Obscured applied after (crits→normals).
- **Defender**: cover saves (prefer crits if critDmg > normalDmg), saves via `saveProb` (AP worsens save, Indomitus ignores AP), binomial enumeration for saved hits, Devastating (MW per crit before saves), JaS (ignore one crit/normal).
- **Rounds**: convolution of `dmgMap` with itself.
- **Exports**: `calcDmgProbs(sit)`, `calcResult(sit)`, `combinedKillChance(s1,s2,wounds)`, `defaultAttacker()`, `defaultDefender()`.
- **Math**: `multinomialProb` (N!/(c!n!f!) * p^c...), `binomialProb`, `dieProbs`/`effectiveDieProbs`.

When editing the engine: keep exact enumeration (no Monte Carlo), ensure `dmgProbs` sums to 1, run `npm run build` to catch TS errors.

## UI — `src/App.tsx` + `src/pages/`

- `IncDec`, `SelectField`, `Toggle` — small controlled inputs. `advanced` prop hides when `showAdvanced` is false (⚙️ gear).
- `SituationPanel` — Attacker + Defender panels + results (avg/injury/kill + histogram bars). Owns `calcResult` via `useMemo`. Lives in `pages/Fight.tsx` (WS label) and `pages/Shooting.tsx` (BS label).
- `App` — shell: topbar/nav (`NavLink` to `/fight`/`/shooting`), help, `Routes` (`/`→`/fight`, `/fight`, `/shooting`, `*`→`/fight`), footer. Banner logic lives in pages.
- Routing via `react-router-dom` `BrowserRouter` with `basename={import.meta.env.BASE_URL}` (see `main.tsx`).

## Styling — `src/App.css`

- Dark topbar (`#0f1117`), card panels, 2-col grid (1-col <900px), stepper buttons, histogram bars (`#6366f1`), banner gradient (`#6366f1→#8b5cf6`).
- Keep `index.css` tokens for light/dark. Prefer CSS over new deps.

## Conventions

- Use `replace_string_in_file` with 3-5 lines context; prefer `insert_edit_into_file` only if replace fails.
- Never print codeblocks for file changes — use edit tools. Never run terminal edits for files.
- After edits, run `npm run build` and `npm run lint`; fix errors before finishing.
- Keep bundle small — avoid adding deps without need.
- Banner text is exactly `Situation 1 does more dmg, enjoy` / `Situation 2 does more dmg, enjoy` / `Both situations deal equal damage — enjoy!` + 🎲.

## Adding Features

- New attacker/defender rule: extend type in `calculator.ts`, handle in `attackerDistribution` or `calcDmgProbs`, add control in `SituationPanel`.
- New view/table: add component in `App.tsx`, style in `App.css`, memoize calculations.
- Tests: add `vitest` if needed (not currently installed).

## Verification

1. `npm run build` passes (tsc + vite)
2. `npm run lint` passes
3. Manual: tweak BS/Attacks, banner updates, histogram reflects probs
