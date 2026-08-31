# KT FOCAS Calculator

Kill Team 2026 odds calculator — guided wizard to work out the odds. Inspired by [ktcalc.com](https://ktcalc.com) (open source [jfreal/ktcalc](https://github.com/jfreal/ktcalc)).

Exact-enumeration probability engine, operative presets from JSON.

**Live:** https://Rassell.github.io/kt-focas-calculator/ — auto-deployed to GitHub Pages on push to `main`.

## Features

- **Wizard** (`/wizard`) — 4-step guided flow:
  1. **Mode** — Shoot (BS) or Fight (WS)
  2. **Attacker** — pick shooter/fighter from predefined operatives (`src/data/operatives.json`)
  3. **Defender** — pick target from the same JSON (save, wounds, cover, etc.)
  4. **Statistics** — Average Damage, Injury Chance, Kill Chance, damage histogram + exact probabilities (via `calcResult`)
- **Operatives JSON** — each entry has `shoot`/`fight` `Attacker` profiles and a `defender` `Defender` profile; searchable by name/faction/role
- **Engine** — same exact-enumeration engine as before (multinomial + binomial, no Monte Carlo)
- Help panel

## Tech Stack

Vite 8 + React 19 + TypeScript 6 + React Compiler (Babel) + React Router 7. No other runtime deps.

## Getting Started

```bash
npm install
npm run dev      # dev server with HMR (base = /)
npm run build    # tsc -b && vite build (base = /kt-focas-calculator/ for Pages)
npm run preview  # preview production build
npm run lint     # eslint .
```

## Project Structure

```
src/
  App.tsx              # Shell: topbar, help, footer + Routes (wizard only)
  App.css              # Layout, wizard, histogram
  index.css            # Design tokens
  main.tsx             # Entry: BrowserRouter with basename=BASE_URL
  pages/
    Wizard.tsx         # 4-step wizard (mode → attacker → defender → stats)
  data/
    operatives.json    # Predefined operatives (shoot/fight/defender presets)
  engine/
    calculator.ts      # Probability engine (multinomial + binomial enumeration)
public/
  favicon.svg
.github/workflows/deploy.yml  # GitHub Pages deploy
```

## Deployment — GitHub Pages

Deployed as a project site at `https://Rassell.github.io/kt-focas-calculator/`.

- `vite.config.ts` sets `base: '/kt-focas-calculator/'` — required for project sites (`https://<user>.github.io/<repo>/`). For a user/org site (`<user>.github.io`) use `'/'`.
- `src/main.tsx` uses `<BrowserRouter basename={import.meta.env.BASE_URL}>` so `/wizard` works under the subpath; dev stays at `/`.
- `.github/workflows/deploy.yml` builds on `push` to `main` (and manual dispatch), copies `dist/index.html` → `dist/404.html` for SPA fallback (direct deep links), then deploys via `actions/deploy-pages`.

**One-time setup:** Repo → Settings → Pages → Source: `GitHub Actions`.

## Engine

`src/engine/calculator.ts` — exact enumeration (no Monte Carlo):

- `dieProbs` / `effectiveDieProbs` (Ceaseless = reroll 1s)
- `attackerDistribution` — enumerates (crits, normals, fails) with Balanced/Relentless rerolls, then `applyAbilities` (Accurate, Punishing, Severe, Rending) and Obscured
- `calcDmgProbs` — cover saves, defender saves (binomial), Devastating, JaS, multi-round convolution
- Exports: `calcDmgProbs`, `calcResult`, `combinedKillChance`, `defaultAttacker`, `defaultDefender`

## Agents

See [AGENTS.md](./AGENTS.md) for AI agent instructions, conventions, and verification steps.

## Credits

- Inspired by [ktcalc.com](https://ktcalc.com) by jfreal — [GitHub](https://github.com/jfreal/ktcalc), fork of [KT21Calculator](https://github.com/jmegner/KT21Calculator)
- [Lite Rules PDF](https://assets.warhammer-community.com/killteam_keydownloads_literules_eng-jfhe9v0j7c-n0x6ozmgo9.pdf)

## License

MIT (or as per original ktcalc).
