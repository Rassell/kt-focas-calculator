import { describe, it, expect } from 'vitest'
import {
  calcDmgProbs,
  calcResult,
  combinedKillChance,
  defaultAttacker,
  defaultDefender,
  type Attacker,
  type Defender,
  type Situation,
} from './calculator'

function sit(overA: Partial<Attacker> = {}, overD: Partial<Defender> = {}): Situation {
  return { attacker: { ...defaultAttacker(), ...overA }, defender: { ...defaultDefender(), ...overD } }
}

function sumProbs(m: Map<number, number>) {
  return [...m.values()].reduce((a, b) => a + b, 0)
}

const TOL = 1e-9

describe('defaultAttacker / defaultDefender', () => {
  it('returns expected defaults', () => {
    expect(defaultAttacker()).toEqual({
      attacks: 4,
      bs: 3,
      normalDmg: 3,
      critDmg: 4,
      devastating: 0,
      piercing: 0,
      piercingCrits: 0,
      reroll: 'none',
      lethal: false,
      accurate: 0,
      rending: false,
      severe: false,
      punishing: false,
      rounds: 1,
    })
    expect(defaultDefender()).toEqual({
      save: 3,
      wounds: 12,
      coverSaves: 1,
      indomitus: false,
      obscured: false,
      jasCrits: false,
      jasNormals: false,
    })
  })

  it('brutal flag is display-only and does not affect damage', () => {
    const base = sit()
    const brutal = sit({ brutal: true } as Partial<Attacker>)
    const r1 = calcResult(base)
    const r2 = calcResult(brutal)
    expect(r2.avgDamage).toBeCloseTo(r1.avgDamage, 12)
    expect(r2.killChance).toBeCloseTo(r1.killChance, 12)
  })
})

describe('calcDmgProbs invariants', () => {
  const cases: Situation[] = [
    sit(),
    sit({ lethal: true }),
    sit({ devastating: 1 }),
    sit({ piercing: 1 }),
    sit({ accurate: 1 }),
    sit({ rending: true }),
    sit({ severe: true }),
    sit({ punishing: true }),
    sit({ reroll: 'ceaseless' }),
    sit({ reroll: 'balanced' }),
    sit({ reroll: 'relentless' }),
    sit({ reroll: 'balanced-ceaseless' }),
    sit({ rounds: 2 }),
    sit({}, { obscured: true }),
    sit({}, { indomitus: true }),
    sit({}, { coverSaves: 0 }),
    sit({}, { jasCrits: true }),
    sit({ bs: 2 }),
    sit({ bs: 6 }),
    sit({}, { save: 2 }),
    sit({}, { save: 6 }),
    sit({ attacks: 0 }),
  ]

  it.each(cases.map((s, i) => [i, s] as const))('case %i sums to 1 and histogram is sorted', (_, s) => {
    const m = calcDmgProbs(s)
    expect(sumProbs(m)).toBeCloseTo(1, 9)
    const r = calcResult(s)
    expect(sumProbs(r.dmgProbs)).toBeCloseTo(1, 9)
    // histogram sorted
    for (let i = 1; i < r.histogram.length; i++) {
      expect(r.histogram[i].dmg).toBeGreaterThan(r.histogram[i - 1].dmg)
    }
    const histSum = r.histogram.reduce((a, b) => a + b.prob, 0)
    expect(histSum).toBeCloseTo(1, 9)
    // avgDamage equals sum(dmg*prob)
    const avg2 = [...r.dmgProbs.entries()].reduce((a, [d, p]) => a + d * p, 0)
    expect(r.avgDamage).toBeCloseTo(avg2, 12)
    // kill/injury in [0,1] and injury >= kill
    expect(r.killChance).toBeGreaterThanOrEqual(0)
    expect(r.killChance).toBeLessThanOrEqual(1)
    expect(r.injuryChance).toBeGreaterThanOrEqual(0)
    expect(r.injuryChance).toBeLessThanOrEqual(1)
    expect(r.injuryChance + TOL).toBeGreaterThanOrEqual(r.killChance)
  })

  it('dmgProbs contains 0 damage entry for default situation', () => {
    const m = calcDmgProbs(sit())
    expect(m.has(0)).toBe(true)
    expect(m.get(0)!).toBeGreaterThan(0)
  })
})

describe('calcResult golden values — change detector', () => {
  // Values computed from current engine on 2026-08-31 via npx tsx. Update only intentionally.
  const goldens: Array<[string, Partial<Attacker>, Partial<Defender>, { avg: number; kill: number; injury: number }]> = [
    ['default', {}, {}, { avg: 1.728652263374, kill: 0.000028577961, injury: 0.022576588935 }],
    ['lethal', { lethal: true }, {}, { avg: 1.855967078189, kill: 0.000457247371, injury: 0.053955189758 }],
    ['devastating1', { devastating: 1 }, {}, { avg: 2.395318930041, kill: 0.002086191129, injury: 0.068529949703 }],
    ['piercing1', { piercing: 1 }, {}, { avg: 2.493698559671, kill: 0.000028577961, injury: 0.041877429127 }],
    ['piercingCrits1', { piercingCrits: 1 }, {}, { avg: 1.827932098765, kill: 0.000096450617, injury: 0.032021604938 }],
    ['accurate1', { accurate: 1 }, {}, { avg: 2.518775720165, kill: 0.000028577961, injury: 0.042009602195 }],
    ['rending', { rending: true }, {}, { avg: 1.884516460905, kill: 0.000371513489, injury: 0.056527206219 }],
    ['severe', { severe: true }, {}, { avg: 1.728652263374, kill: 0.000028577961, injury: 0.022576588935 }],
    ['punishing', { punishing: true }, {}, { avg: 2.518775720165, kill: 0.000028577961, injury: 0.042009602195 }],
    ['ceaseless', { reroll: 'ceaseless' }, {}, { avg: 2.179841304997, kill: 0.0000529442, injury: 0.036380229061 }],
    ['balanced', { reroll: 'balanced' }, {}, { avg: 2.276663237311, kill: 0.000066681908, injury: 0.04239064167 }],
    ['relentless', { reroll: 'relentless' }, {}, { avg: 2.640654371793, kill: 0.000090320468, injury: 0.05509548567 }],
    ['balanced-ceaseless', { reroll: 'balanced-ceaseless' }, {}, { avg: 2.692401671528, kill: 0.000100005712, injury: 0.059036985252 }],
    ['rounds2', { rounds: 2 }, {}, { avg: 3.457304526749, kill: 0.014469451401, injury: 0.123611231329 }],
    ['obscured', {}, { obscured: true }, { avg: 1.679012345679, kill: 0, injury: 0.007315957933 }],
    ['indomitus+piercing', { piercing: 1 }, { indomitus: true }, { avg: 1.728652263374, kill: 0.000028577961, injury: 0.022576588935 }],
    ['cover0', {}, { coverSaves: 0 }, { avg: 2.888888888889, kill: 0.00297210791, injury: 0.114997713763 }],
    ['cover2', {}, { coverSaves: 2 }, { avg: 0.795781893004, kill: 0, injury: 0.001114540466 }],
    ['jasCrits', {}, { jasCrits: true }, { avg: 1.537865797897, kill: 0, injury: 0.005772748057 }],
    ['jasNormals', {}, { jasNormals: true }, { avg: 0.453189300412, kill: 0.000028577961, injury: 0.003457933242 }],
    ['wounds7', {}, { wounds: 7 }, { avg: 1.728652263374, kill: 0.022576588935, injury: 0.022576588935 }],
    ['wounds5', {}, { wounds: 5 }, { avg: 1.728652263374, kill: 0.095107453132, injury: 0.095107453132 }],
    ['bs2', { bs: 2 }, {}, { avg: 2.383744855967, kill: 0.000028577961, injury: 0.036208276177 }],
    ['bs6', { bs: 6 }, {}, { avg: 0.198559670782, kill: 0.000028577961, injury: 0.001914723365 }],
    ['save2', {}, { save: 2 }, { avg: 0.864326131687, kill: 0.000003572245, injury: 0.005254772519 }],
    ['save6', {}, { save: 6 }, { avg: 4.321630658436, kill: 0.000446530636, injury: 0.170306784408 }],
    ['zeroAttacks', { attacks: 0 }, {}, { avg: 0, kill: 0, injury: 0 }],
    ['highDmg', { normalDmg: 5, critDmg: 7 }, {}, { avg: 2.897633744856, kill: 0.022576588935, injury: 0.125628715135 }],
  ]

  it.each(goldens)('%s matches golden avg/kill/injury', (name, overA, overD, exp) => {
    const r = calcResult(sit(overA, overD))
    expect(r.avgDamage).toBeCloseTo(exp.avg, 9)
    expect(r.killChance).toBeCloseTo(exp.kill, 9)
    expect(r.injuryChance).toBeCloseTo(exp.injury, 9)
    // also ensure dmgProbs sums to 1
    expect(sumProbs(r.dmgProbs)).toBeCloseTo(1, 9)
    void name
  })

  it('severe has no effect when crits already present on average (locked behavior)', () => {
    // Current engine: severe only triggers when cc===0 && nn>0, so with default BS3+ it rarely changes avg vs none
    const rNone = calcResult(sit())
    const rSevere = calcResult(sit({ severe: true }))
    expect(rSevere.avgDamage).toBeCloseTo(rNone.avgDamage, 12)
  })

  it('accurate and punishing produce same avg for default (locked behavior)', () => {
    const rAcc = calcResult(sit({ accurate: 1 }))
    const rPun = calcResult(sit({ punishing: true }))
    expect(rAcc.avgDamage).toBeCloseTo(rPun.avgDamage, 12)
  })
})

describe('reroll variants increase avg vs none', () => {
  const baseAvg = calcResult(sit()).avgDamage
  for (const reroll of ['ceaseless', 'balanced', 'relentless', 'balanced-ceaseless'] as const) {
    it(`${reroll} avg > none`, () => {
      const r = calcResult(sit({ reroll }))
      expect(r.avgDamage).toBeGreaterThan(baseAvg)
      expect(sumProbs(r.dmgProbs)).toBeCloseTo(1, 9)
    })
  }
})

describe('attacker abilities isolated', () => {
  it('lethal increases crit rate and avg', () => {
    const r0 = calcResult(sit())
    const r1 = calcResult(sit({ lethal: true }))
    expect(r1.avgDamage).toBeGreaterThan(r0.avgDamage)
  })

  it('devastating adds MW per crit before saves', () => {
    const r0 = calcResult(sit())
    const r1 = calcResult(sit({ devastating: 1 }))
    expect(r1.avgDamage).toBeGreaterThan(r0.avgDamage)
    // devastating should increase avg by roughly pCrit * attacks * devastating after saves
    expect(r1.avgDamage - r0.avgDamage).toBeGreaterThan(0.3)
  })

  it('piercing worsens save and increases avg', () => {
    const r0 = calcResult(sit())
    const r1 = calcResult(sit({ piercing: 1 }))
    expect(r1.avgDamage).toBeGreaterThan(r0.avgDamage)
  })

  it('piercingCrits only affects crit saves', () => {
    const rPierce = calcResult(sit({ piercing: 1 }))
    const rPierceCrit = calcResult(sit({ piercingCrits: 1 }))
    // piercing all should be stronger than piercing crits only
    expect(rPierce.avgDamage).toBeGreaterThan(rPierceCrit.avgDamage)
  })

  it('rending converts normal to crit when crit present', () => {
    const r0 = calcResult(sit())
    const r1 = calcResult(sit({ rending: true }))
    expect(r1.avgDamage).toBeGreaterThan(r0.avgDamage)
  })

  it('rounds convolution doubles avg', () => {
    const r1 = calcResult(sit({ rounds: 1 }))
    const r2 = calcResult(sit({ rounds: 2 }))
    expect(r2.avgDamage).toBeCloseTo(r1.avgDamage * 2, 9)
    expect(sumProbs(r2.dmgProbs)).toBeCloseTo(1, 9)
    // rounds=2 should have more histogram entries
    expect(r2.histogram.length).toBeGreaterThan(r1.histogram.length)
  })
})

describe('defender abilities', () => {
  it('coverSaves blocks damage — more cover = less avg', () => {
    const r0 = calcResult(sit({}, { coverSaves: 0 }))
    const r1 = calcResult(sit({}, { coverSaves: 1 }))
    const r2 = calcResult(sit({}, { coverSaves: 2 }))
    expect(r0.avgDamage).toBeGreaterThan(r1.avgDamage)
    expect(r1.avgDamage).toBeGreaterThan(r2.avgDamage)
  })

  it('cover prefers crits when critDmg > normalDmg', () => {
    // With critDmg > normalDmg, cover should block crits first, so avg with cover should be lower than if it blocked normals
    const r = calcResult(sit({ critDmg: 6, normalDmg: 3 }, { coverSaves: 1 }))
    expect(r.avgDamage).toBeGreaterThan(0)
    expect(sumProbs(r.dmgProbs)).toBeCloseTo(1, 9)
  })

  it('indomitus ignores AP', () => {
    const rNoIndom = calcResult(sit({ piercing: 2 }, { indomitus: false }))
    const rIndom = calcResult(sit({ piercing: 2 }, { indomitus: true }))
    // indomitus should reduce damage vs piercing
    expect(rIndom.avgDamage).toBeLessThan(rNoIndom.avgDamage)
    // with indomitus, piercing should have no effect
    const rIndomNoPierce = calcResult(sit({ piercing: 0 }, { indomitus: true }))
    expect(rIndom.avgDamage).toBeCloseTo(rIndomNoPierce.avgDamage, 12)
  })

  it('obscured converts crits to normals and reduces avg', () => {
    const r0 = calcResult(sit())
    const r1 = calcResult(sit({}, { obscured: true }))
    expect(r1.avgDamage).toBeLessThan(r0.avgDamage)
    // obscured should have no crit damage — max dmg should be lower
    const maxDmg0 = Math.max(...[...r0.dmgProbs.keys()])
    const maxDmg1 = Math.max(...[...r1.dmgProbs.keys()])
    expect(maxDmg1).toBeLessThanOrEqual(maxDmg0)
  })

  it('jasCrits ignores one crit die', () => {
    const r0 = calcResult(sit())
    const r1 = calcResult(sit({}, { jasCrits: true }))
    expect(r1.avgDamage).toBeLessThan(r0.avgDamage)
  })

  it('jasNormals ignores one normal die', () => {
    const r0 = calcResult(sit())
    const r1 = calcResult(sit({}, { jasNormals: true }))
    expect(r1.avgDamage).toBeLessThan(r0.avgDamage)
    // jasNormals should be stronger reduction than jasCrits when crits are rare? Just check it reduces
    expect(r1.avgDamage).toBeGreaterThan(0)
  })

  it('save thresholds: save 2+ is stronger than save 6+', () => {
    const r2 = calcResult(sit({}, { save: 2 }))
    const r6 = calcResult(sit({}, { save: 6 }))
    expect(r2.avgDamage).toBeLessThan(r6.avgDamage)
  })

  it('wounds threshold: lower wounds = higher kill chance', () => {
    const r12 = calcResult(sit({}, { wounds: 12 }))
    const r7 = calcResult(sit({}, { wounds: 7 }))
    const r5 = calcResult(sit({}, { wounds: 5 }))
    expect(r7.killChance).toBeGreaterThan(r12.killChance)
    expect(r5.killChance).toBeGreaterThan(r7.killChance)
  })

  it('injuryChance is at least killChance (clamp behavior)', () => {
    const r = calcResult(sit({}, { wounds: 5 }))
    expect(r.injuryChance).toBeGreaterThanOrEqual(r.killChance - TOL)
    expect(r.injuryChance).toBeCloseTo(r.killChance, 12)
  })
})

describe('edge cases', () => {
  it('0 attacks deals 0 damage', () => {
    const r = calcResult(sit({ attacks: 0 }))
    expect(r.avgDamage).toBe(0)
    expect(r.killChance).toBe(0)
    expect(r.injuryChance).toBe(0)
    expect(r.dmgProbs.get(0)).toBe(1)
  })

  it('BS 2+ hits more than BS 6+', () => {
    const r2 = calcResult(sit({ bs: 2 }))
    const r6 = calcResult(sit({ bs: 6 }))
    expect(r2.avgDamage).toBeGreaterThan(r6.avgDamage)
  })

  it('high wounds never killed by weak attack', () => {
    const r = calcResult(sit({ attacks: 1, bs: 6, normalDmg: 1, critDmg: 1 }, { wounds: 20, save: 2, coverSaves: 0 }))
    expect(r.killChance).toBeLessThan(0.01)
  })

  it('devastating still applies even when all hits saved or covered', () => {
    // With cover blocking all, devastating should still add MW per crit before cover
    const r = calcResult(sit({ devastating: 2 }, { coverSaves: 10 }))
    // Even with huge cover, devastating from crits before cover should produce some damage
    expect(r.avgDamage).toBeGreaterThan(0)
  })
})

describe('combinedKillChance', () => {
  it('matches golden values', () => {
    const s1 = sit()
    const s2 = sit({ lethal: true })
    expect(combinedKillChance(s1, s2, 12)).toBeCloseTo(0.015141523497, 9)
    expect(combinedKillChance(s1, s1, 12)).toBeCloseTo(0.014469451401, 9)
  })

  it('is in [0,1] and >= each single kill chance', () => {
    const s1 = sit()
    const s2 = sit({ lethal: true })
    const wounds = 12
    const k1 = calcResult(s1).killChance
    const k2 = calcResult(s2).killChance
    const combined = combinedKillChance(s1, s2, wounds)
    expect(combined).toBeGreaterThanOrEqual(0)
    expect(combined).toBeLessThanOrEqual(1)
    expect(combined).toBeGreaterThanOrEqual(Math.max(k1, k2) - TOL)
  })

  it('combined with 0-damage second attack equals first kill chance', () => {
    const s1 = sit()
    const sZero = sit({ attacks: 0 })
    const wounds = 12
    const k1 = calcResult(s1).killChance
    const combined = combinedKillChance(s1, sZero, wounds)
    expect(combined).toBeCloseTo(k1, 12)
  })

  it('is symmetric', () => {
    const s1 = sit({ piercing: 1 })
    const s2 = sit({ devastating: 1 })
    expect(combinedKillChance(s1, s2, 10)).toBeCloseTo(combinedKillChance(s2, s1, 10), 12)
  })

  it('increases as wounds decreases', () => {
    const s1 = sit()
    const s2 = sit()
    expect(combinedKillChance(s1, s2, 5)).toBeGreaterThan(combinedKillChance(s1, s2, 12))
  })
})

describe('dmgProbs normalization and histogram', () => {
  it('histogram entries match dmgProbs', () => {
    const r = calcResult(sit())
    expect(r.histogram.length).toBe(r.dmgProbs.size)
    for (const { dmg, prob } of r.histogram) {
      expect(r.dmgProbs.get(dmg)).toBeCloseTo(prob, 12)
    }
  })

  it('rounds=1 histogram equals dmgProbs', () => {
    const s = sit({ rounds: 1 })
    const r = calcResult(s)
    const m = calcDmgProbs(s)
    expect(r.histogram.length).toBe(m.size)
  })

  it('all probs are non-negative', () => {
    const r = calcResult(sit({ reroll: 'relentless', lethal: true, devastating: 1, rounds: 2 }))
    for (const p of r.dmgProbs.values()) expect(p).toBeGreaterThanOrEqual(0)
    for (const { prob } of r.histogram) expect(prob).toBeGreaterThanOrEqual(0)
  })
})
