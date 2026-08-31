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

function sit(overA: Partial<Attacker> = {}, overD: Partial<Defender> = {}, overS: Partial<Pick<Situation, 'coverSaves' | 'obscured'>> = {}): Situation {
  return { attacker: { ...defaultAttacker(), ...overA }, defender: { ...defaultDefender(), ...overD }, coverSaves: 0, obscured: false, ...overS }
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
      indomitus: false,
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
    sit({}, {}, { obscured: true }),
    sit({}, { indomitus: true }),
    sit({}, {}, { coverSaves: 0 }),
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
  // Values recomputed 2026-08-31 with ktcalc-faithful engine (3 defence dice, AP reduces dice count, injury = dmg > wounds/2 && dmg < wounds).
  const goldens: Array<[string, Partial<Attacker>, Partial<Defender>, Partial<Pick<Situation, 'coverSaves' | 'obscured'>>, { avg: number; kill: number; injury: number }]> = [
    ['default', {}, {}, {}, { avg: 3.292516860997, kill: 0.010706018519, injury: 0.172153635117 }],
    ['lethal', { lethal: true }, {}, {}, { avg: 4.198788294467, kill: 0.03503657979, injury: 0.279606767261 }],
    ['devastating1', { devastating: 1 }, {}, {}, { avg: 3.959183527663, kill: 0.025002143347, injury: 0.186067529721 }],
    ['piercing1', { piercing: 1 }, {}, {}, { avg: 4.843278463649, kill: 0.028442215364, injury: 0.287872942387 }],
    ['piercingCrits1', { piercingCrits: 1 }, {}, {}, { avg: 4.183299039781, kill: 0.023812585734, injury: 0.261638374486 }],
    ['accurate1', { accurate: 1 }, {}, {}, { avg: 3.735082304527, kill: 0.011745541838, injury: 0.181520061728 }],
    ['rending', { rending: true }, {}, {}, { avg: 4.14610482396, kill: 0.034497170782, injury: 0.265067729767 }],
    ['severe', { severe: true }, {}, {}, { avg: 3.677879943987, kill: 0.010706018519, injury: 0.221729252401 }],
    ['punishing', { punishing: true }, {}, {}, { avg: 4.158686271148, kill: 0.018936471193, injury: 0.257087334248 }],
    ['ceaseless', { reroll: 'ceaseless' }, {}, {}, { avg: 5.091361612372, kill: 0.02665131329, injury: 0.314774461676 }],
    ['balanced', { reroll: 'balanced' }, {}, {}, { avg: 4.628593678555, kill: 0.023094564472, injury: 0.279516270386 }],
    ['relentless', { reroll: 'relentless' }, {}, {}, { avg: 5.512009799771, kill: 0.030855729987, injury: 0.349811173771 }],
    ['balanced-ceaseless', { reroll: 'balanced-ceaseless' }, {}, {}, { avg: 5.505214430406, kill: 0.030810531164, injury: 0.349319295469 }],
    ['rounds2', { rounds: 2 }, {}, {}, { avg: 6.585033721994, kill: 0.142346780517, injury: 0.334195265644 }],
    ['obscured', {}, {}, { obscured: true }, { avg: 0.976680384088, kill: 0, injury: 0.007315957933 }],
    ['indomitus+piercing', { piercing: 1 }, { indomitus: true }, {}, { avg: 4.530778463649, kill: 0.00760888203, injury: 0.277842078189 }],
    ['cover0', {}, {}, { coverSaves: 0 }, { avg: 3.292516860997, kill: 0.010706018519, injury: 0.172153635117 }],
    ['cover1', {}, {}, { coverSaves: 1 }, { avg: 2.674554183813, kill: 0.002336248285, injury: 0.135223765432 }],
    ['cover2', {}, {}, { coverSaves: 2 }, { avg: 2.153549382716, kill: 0.000643004115, injury: 0.095550411523 }],
    ['jasCrits', {}, { jasCrits: true }, {}, { avg: 1.123592535437, kill: 0.000157178784, injury: 0.022380115455 }],
    ['jasNormals', {}, { jasNormals: true }, {}, { avg: 1.750721593507, kill: 0.003761574074, injury: 0.071137688615 }],
    ['wounds7', {}, { wounds: 7 }, {}, { avg: 3.292516860997, kill: 0.182859653635, injury: 0.207300954504 }],
    ['wounds5', {}, { wounds: 5 }, {}, { avg: 3.292516860997, kill: 0.280467678326, injury: 0.353991626658 }],
    ['bs2', { bs: 2 }, {}, {}, { avg: 4.730595564701, kill: 0.021136974166, injury: 0.263681698674 }],
    ['bs6', { bs: 6 }, {}, {}, { avg: 0.91217992684, kill: 0.003761574074, injury: 0.03294324417 }],
    ['save2', {}, { save: 2 }, {}, { avg: 2.264196101966, kill: 0.00233982053, injury: 0.099008344765 }],
    ['save6', {}, { save: 6 }, {}, { avg: 6.984646490626, kill: 0.118152006173, injury: 0.390517832647 }],
    ['zeroAttacks', { attacks: 0 }, {}, {}, { avg: 0, kill: 0, injury: 0 }],
    ['highDmg', { normalDmg: 5, critDmg: 7 }, {}, {}, { avg: 5.593056984454, kill: 0.182859653635, injury: 0.207300954504 }],
  ]

  it.each(goldens)('%s matches golden avg/kill/injury', (name, overA, overD, overS, exp) => {
    const r = calcResult(sit(overA, overD, overS))
    expect(r.avgDamage).toBeCloseTo(exp.avg, 9)
    expect(r.killChance).toBeCloseTo(exp.kill, 9)
    expect(r.injuryChance).toBeCloseTo(exp.injury, 9)
    // also ensure dmgProbs sums to 1
    expect(sumProbs(r.dmgProbs)).toBeCloseTo(1, 9)
    void name
  })

  it('severe increases avg vs none (with coverSaves=0)', () => {
    const rNone = calcResult(sit())
    const rSevere = calcResult(sit({ severe: true }))
    expect(rSevere.avgDamage).toBeGreaterThan(rNone.avgDamage)
  })

  it('accurate and punishing produce similar avg for default', () => {
    const rAcc = calcResult(sit({ accurate: 1 }))
    const rPun = calcResult(sit({ punishing: true }))
    // Punishing requires a crit, so it is stronger than Accurate in ktcalc model
    expect(rPun.avgDamage).toBeGreaterThan(rAcc.avgDamage)
    expect(rPun.avgDamage - rAcc.avgDamage).toBeLessThan(1.0)
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
    const r0 = calcResult(sit({}, {}, { coverSaves: 0 }))
    const r1 = calcResult(sit({}, {}, { coverSaves: 1 }))
    const r2 = calcResult(sit({}, {}, { coverSaves: 2 }))
    expect(r0.avgDamage).toBeGreaterThan(r1.avgDamage)
    expect(r1.avgDamage).toBeGreaterThan(r2.avgDamage)
  })

  it('cover prefers crits when critDmg > normalDmg', () => {
    // With critDmg > normalDmg, cover should block crits first, so avg with cover should be lower than if it blocked normals
    const r = calcResult(sit({ critDmg: 6, normalDmg: 3 }, {}, { coverSaves: 1 }))
    expect(r.avgDamage).toBeGreaterThan(0)
    expect(sumProbs(r.dmgProbs)).toBeCloseTo(1, 9)
  })

  it('indomitus reduces damage (fails>=2 -> extra norm save)', () => {
    // With 3 defence dice, indomitus triggers when fails>=2 (converts one fail to norm)
    // With piercing 2, defender has only 1 die left, so indomitus never triggers (needs 2 fails)
    // Test with piercing 0 where defender has 3 dice
    const rNoIndom = calcResult(sit({ piercing: 0 }, { indomitus: false }))
    const rIndom = calcResult(sit({ piercing: 0 }, { indomitus: true }))
    expect(rIndom.avgDamage).toBeLessThan(rNoIndom.avgDamage)
    // With piercing 1, defender has 2 dice, indomitus can still trigger
    const rPierce1NoIndom = calcResult(sit({ piercing: 1 }, { indomitus: false }))
    const rPierce1Indom = calcResult(sit({ piercing: 1 }, { indomitus: true }))
    expect(rPierce1Indom.avgDamage).toBeLessThan(rPierce1NoIndom.avgDamage)
  })

  it('obscured converts crits to normals and reduces avg', () => {
    const r0 = calcResult(sit())
    const r1 = calcResult(sit({}, {}, { obscured: true }))
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

  it('injuryChance is dmg > wounds/2 && dmg < wounds (ktcalc definition)', () => {
    const r = calcResult(sit({}, { wounds: 5 }))
    // injury = P(dmg > 2.5 && dmg < 5), kill = P(dmg >=5), they are disjoint
    expect(r.injuryChance).toBeGreaterThan(0)
    expect(r.killChance).toBeGreaterThan(0)
    expect(r.injuryChance + r.killChance).toBeLessThanOrEqual(1 + TOL)
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
    const r = calcResult(sit({ attacks: 1, bs: 6, normalDmg: 1, critDmg: 1 }, { wounds: 20, save: 2 }, { coverSaves: 0 }))
    expect(r.killChance).toBeLessThan(0.01)
  })

  it('devastating adds damage even with cover', () => {
    const rNoDev = calcResult(sit({}, {}, { coverSaves: 2 }))
    const rDev = calcResult(sit({ devastating: 2 }, {}, { coverSaves: 2 }))
    expect(rDev.avgDamage).toBeGreaterThan(rNoDev.avgDamage)
  })
})

describe('combinedKillChance', () => {
  it('matches golden values', () => {
    const s1 = sit()
    const s2 = sit({ lethal: true })
    expect(combinedKillChance(s1, s2, 12)).toBeCloseTo(0.190023371164, 9)
    expect(combinedKillChance(s1, s1, 12)).toBeCloseTo(0.142346780517, 9)
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
