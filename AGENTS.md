# AGENTS.md — KT FOCAS Calculator

> Instructions for AI agents working in this repo. Keep this file concise and update it when conventions change.

## Overview

KT FOCAS Calculator is a Kill Team 2026 odds calculator — single guided Wizard flow, inspired by https://ktcalc.com (open source https://github.com/jfreal/ktcalc). Exact-enumeration probability engine, operative presets from JSON. Live at https://Rassell.github.io/kt-focas-calculator/ via GitHub Pages.

## Tech Stack

- Vite 8 + React 19 + TypeScript 6 + React Compiler (Babel) + React Router 7 (`/wizard` only)
- No other extra runtime deps (no recharts). Pure React + CSS.
- ESLint flat config (`eslint.config.js`), `tsc -b` for type checking.
- GitHub Pages project site: `vite.config.ts` `base: '/kt-focas-calculator/'`, `BrowserRouter basename={import.meta.env.BASE_URL}`.

## Project Structure

```
src/
  App.tsx                 # Shell: topbar, help, Routes (/wizard), footer
  App.css                 # Layout, wizard, histogram, responsive grid
  index.css               # Design tokens (light/dark), base typography
  main.tsx                # StrictMode + createRoot + BrowserRouter basename=BASE_URL
  pages/
    Wizard.tsx            # 4-step wizard: mode → attacker → defender → stats (calcResult)
  data/
    operatives.json       # Predefined operatives: { shoot, fight, defender } per entry
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
- `src/main.tsx` `BrowserRouter basename={import.meta.env.BASE_URL}` — route `/wizard` works under subpath; dev stays at `/`.
- `.github/workflows/deploy.yml` — on `push` to `main` + `workflow_dispatch`: `npm ci` → `npm run build` → `cp dist/index.html dist/404.html` (SPA fallback for deep links) → `configure-pages` → `upload-pages-artifact` → `deploy-pages`. Requires Settings → Pages → Source: `GitHub Actions`.
- When adding routes, keep SPA fallback (`404.html`) and `basename` in mind; test `npm run build && npm run preview` and check `dist/index.html` asset paths include `/kt-focas-calculator/`.

## Engine — `src/engine/calculator.ts`

- **Types**: `Attacker` (attacks, bs 2-6, normalDmg, critDmg, devastating, piercing, piercingCrits, reroll, lethal, accurate, rending, severe, punishing, rounds), `Defender` (save 2-6, wounds, indomitus, jasCrits, jasNormals), `Situation` (`attacker`, `defender`, `coverSaves`, `obscured` situational checks), `CalcResult` (avgDamage, injuryChance, killChance, dmgProbs, histogram).
- **Reroll**: `none | balanced | relentless | ceaseless | balanced-ceaseless`. Ceaseless handled via `effectiveDieProbs` (reroll 1s); Balanced/Relentless via enumeration in `attackerDistribution`.
- **Attacker abilities** in `applyAbilities`: Accurate (retain fails as normals), Punishing (retain one fail), Severe (no crits → norm→crit), Rending (≥1 crit → norm→crit).
- **Situation checks**: `coverSaves` (auto-block X hits, prefer crits if critDmg > normalDmg) and `obscured` (crits→normals) applied in `calcDmgProbs` before defender saves. Defender saves via `saveProb` (AP worsens save, Indomitus ignores AP), binomial enumeration, Devastating (MW per crit before saves), JaS (ignore one crit/normal).
- **Rounds**: convolution of `dmgMap` with itself.
- **Exports**: `calcDmgProbs(sit)`, `calcResult(sit)`, `combinedKillChance(s1,s2,wounds)`, `defaultAttacker()`, `defaultDefender()`, `defaultSituation()`.
- **Math**: `multinomialProb` (N!/(c!n!f!) * p^c...), `binomialProb`, `dieProbs`/`effectiveDieProbs`.

When editing the engine: keep exact enumeration (no Monte Carlo), ensure `dmgProbs` sums to 1, run `npm run build` to catch TS errors.

## UI — `src/App.tsx` + `src/pages/Wizard.tsx`

- `Wizard.tsx` — 4-step flow: mode (shoot/fight) → attacker (searchable grid from `operatives.json`, `shoot`/`fight` profile per mode) → defender (same JSON, `defender` profile) → stats (`calcResult` → avg/injury/kill + histogram + exact probs). State: `step`, `mode`, `attackerId`, `defenderId`, search queries. Mappers `toAttacker`/`toDefender`.
- `App` — shell: topbar, help, `Routes` (`/`→`/wizard`, `/wizard`, `*`→`/wizard`), footer. No other pages.
- Routing via `react-router-dom` `BrowserRouter` with `basename={import.meta.env.BASE_URL}` (see `main.tsx`).

## Styling — `src/App.css`

- Dark topbar (`#0f1117`), wizard progress dots, mode cards, operative grid, summary vs layout, histogram bars (`#6366f1`).
- Keep `index.css` tokens for light/dark. Prefer CSS over new deps.

## Conventions

- Use `replace_string_in_file` with 3-5 lines context; prefer `insert_edit_into_file` only if replace fails.
- Never print codeblocks for file changes — use edit tools. Never run terminal edits for files.
- After edits, run `npm run build` and `npm run lint`; fix errors before finishing.
- Keep bundle small — avoid adding deps without need.

## Adding Features

- New operative: add entry to `src/data/operatives.json` with `shoot`/`fight`/`defender` fields matching `Attacker`/`Defender` types.
- New attacker/defender rule: extend type in `calculator.ts`, handle in `attackerDistribution` or `calcDmgProbs`, expose in wizard summary if needed.
- New view: add component in `App.tsx` or `pages/`, style in `App.css`, memoize calculations.
- Tests: add `vitest` if needed (not currently installed).

## Verification

1. `npm run build` passes (tsc + vite)
2. `npm run lint` passes
3. Manual: wizard flow mode → attacker → defender → stats shows correct avg/injury/kill + histogram
