# KT FOCAS Calculator

Kill Team 2026 shooting odds calculator — work out the odds of a ranged attack. Inspired by [ktcalc.com](https://ktcalc.com) (open source [jfreal/ktcalc](https://github.com/jfreal/ktcalc)).

Two side-by-side Situations, exact-enumeration probability engine, winner banner.

## Features

- **Attacker**: Attacks, BS (2+–6+), Normal/Crit Dmg, Devastating (MW per crit), Piercing / Piercing Crits, Reroll (None / Balanced / Relentless / Ceaseless / Balanced+Ceaseless), Lethal 5+, Accurate, Rending, Severe, Punishing, Rounds
- **Defender**: Save (2+–6+), Wounds, Cover Saves, Indomitus (ignore AP), Obscured (crits→normals), Just a Scratch (Crits / Normals)
- **Results per Situation**: Average Damage, Injury Chance, Kill Chance, damage histogram
- **Banner**: `Situation 1 does more dmg, enjoy` / `Situation 2 does more dmg, enjoy` (or equal) — based on average damage
- **Advanced** toggle (⚙️) for Devastating, Piercing Crits, Accurate, Rounds
- Copy From Situation 1, Help panel

## Tech Stack

Vite 8 + React 19 + TypeScript 6 + React Compiler (Babel). No extra runtime dependencies.

## Getting Started

```bash
npm install
npm run dev      # dev server with HMR
npm run build    # tsc -b && vite build
npm run preview  # preview production build
npm run lint     # eslint .
```

## Project Structure

```
src/
  App.tsx              # UI: SituationPanel, controls, banner
  App.css              # Layout, panels, banner
  index.css            # Design tokens
  main.tsx             # Entry
  engine/
    calculator.ts      # Probability engine (multinomial + binomial enumeration)
public/
  favicon.svg, icons.svg
```

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
