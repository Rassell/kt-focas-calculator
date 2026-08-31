# AGENTS.md — KT FOCAS Calculator

> Instructions for AI agents working in this repo. Keep this file concise and update it when conventions change.

## Overview

KT FOCAS Calculator is a Kill Team 2026 shooting odds calculator, inspired by https://ktcalc.com (open source https://github.com/jfreal/ktcalc). Two side-by-side Situations, exact-enumeration probability engine, winner banner.

## Tech Stack

- Vite 8 + React 19 + TypeScript 6 + React Compiler (Babel)
- No extra runtime deps (no recharts, no router). Pure React + CSS.
- ESLint flat config (`eslint.config.js`), `tsc -b` for type checking.

## Project Structure

```
src/
  App.tsx                 # UI: SituationPanel, IncDec/Select/Toggle, banner, header/help/footer
  App.css                 # Layout, panels, stepper, banner, responsive grid
  index.css               # Design tokens (light/dark), base typography
  main.tsx                # StrictMode + createRoot
  engine/
    calculator.ts         # Probability engine (see below)
public/
  favicon.svg, icons.svg
index.html, vite.config.ts, tsconfig.*.json
```

## Commands

```bash
npm run dev      # Vite dev server (HMR)
npm run build    # tsc -b && vite build
npm run lint     # eslint .
npm run preview  # vite preview (after build)
```

`npm start` is not defined — use `npm run dev`.

## Engine — `src/engine/calculator.ts`

- **Types**: `Attacker` (attacks, bs 2-6, normalDmg, critDmg, devastating, piercing, piercingCrits, reroll, lethal, accurate, rending, severe, punishing, rounds), `Defender` (save 2-6, wounds, coverSaves, indomitus, obscured, jasCrits, jasNormals), `Situation`, `CalcResult` (avgDamage, injuryChance, killChance, dmgProbs, histogram).
- **Reroll**: `none | balanced | relentless | ceaseless | balanced-ceaseless`. Ceaseless handled via `effectiveDieProbs` (reroll 1s); Balanced/Relentless via enumeration in `attackerDistribution`.
- **Attacker abilities** in `applyAbilities`: Accurate (retain fails as normals), Punishing (retain one fail), Severe (no crits → norm→crit), Rending (≥1 crit → norm→crit). Obscured applied after (crits→normals).
- **Defender**: cover saves (prefer crits if critDmg > normalDmg), saves via `saveProb` (AP worsens save, Indomitus ignores AP), binomial enumeration for saved hits, Devastating (MW per crit before saves), JaS (ignore one crit/normal).
- **Rounds**: convolution of `dmgMap` with itself.
- **Exports**: `calcDmgProbs(sit)`, `calcResult(sit)`, `combinedKillChance(s1,s2,wounds)`, `defaultAttacker()`, `defaultDefender()`.
- **Math**: `multinomialProb` (N!/(c!n!f!) * p^c...), `binomialProb`, `dieProbs`/`effectiveDieProbs`.

When editing the engine: keep exact enumeration (no Monte Carlo), ensure `dmgProbs` sums to 1, run `npm run build` to catch TS errors.

## UI — `src/App.tsx`

- `IncDec`, `SelectField`, `Toggle` — small controlled inputs. `advanced` prop hides when `showAdvanced` is false (⚙️ gear).
- `SituationPanel` — Attacker + Defender panels + results (avg/injury/kill + histogram bars). Owns `calcResult` via `useMemo`.
- `App` — holds `s1`, `s2`, `advanced`, `showHelp`. Computes `r1`, `r2`, `banner` (winner by avgDamage, tie threshold 0.005). Renders two `SituationPanel`s + banner `Situation X does more dmg, enjoy` + header/help/footer.
- No routing, no URL state, no persistence. Add those only if requested.

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
