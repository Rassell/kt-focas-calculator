export type Reroll = 'none' | 'balanced' | 'relentless' | 'ceaseless' | 'balanced-ceaseless'

export interface Attacker {
  attacks: number
  bs: number // 2..6 (2+ .. 6+)
  normalDmg: number
  critDmg: number
  devastating: number // MW per crit
  piercing: number
  piercingCrits: number
  reroll: Reroll
  lethal: boolean // 5+ is crit
  accurate: number
  rending: boolean
  severe: boolean
  punishing: boolean
  rounds: number
  brutal?: boolean // display-only for now; no engine effect yet
}

export interface Defender {
  save: number // 2..6
  wounds: number
  coverSaves: number
  indomitus: boolean
  obscured: boolean
  jasCrits: boolean
  jasNormals: boolean
}

export interface Situation {
  attacker: Attacker
  defender: Defender
}

export interface CalcResult {
  avgDamage: number
  injuryChance: number
  killChance: number
  dmgProbs: Map<number, number>
  histogram: { dmg: number; prob: number }[]
}

function clamp(n: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, n)) }

function dieProbs(bs: number, lethal: boolean) {
  // bs is threshold e.g. 3 means 3+ succeeds
  const pFail = (bs - 1) / 6
  let pCrit: number, pNorm: number
  if (lethal) {
    pCrit = 2 / 6
    pNorm = Math.max(0, (7 - bs - 2) / 6)
  } else {
    pCrit = 1 / 6
    pNorm = Math.max(0, (7 - bs - 1) / 6)
  }
  // sanity: pCrit+pNorm+pFail should be 1
  return { pCrit, pNorm, pFail }
}

function effectiveDieProbs(bs: number, lethal: boolean, reroll: Reroll) {
  const base = dieProbs(bs, lethal)
  let { pCrit, pNorm, pFail } = base
  const p1 = 1 / 6
  if (reroll === 'ceaseless') {
    // reroll 1s
    const pOtherFail = Math.max(0, pFail - p1)
    const newPCrit = pCrit + p1 * pCrit
    const newPNorm = pNorm + p1 * pNorm
    const newPFail = pOtherFail + p1 * pFail
    pCrit = newPCrit; pNorm = newPNorm; pFail = newPFail
  } else if (reroll === 'balanced-ceaseless') {
    // ceaseless + balanced: first ceaseless then balanced reroll one fail
    // apply ceaseless first
    const pOtherFail = Math.max(0, pFail - p1)
    pCrit = pCrit + p1 * pCrit
    pNorm = pNorm + p1 * pNorm
    pFail = pOtherFail + p1 * pFail
    // balanced will be handled via enumeration, not here
  }
  // relentless and balanced are handled via enumeration, not simple prob adjustment
  return { pCrit, pNorm, pFail }
}

// multinomial probability for (c,n,f) with N dice
function multinomialProb(N: number, c: number, n: number, f: number, pCrit: number, pNorm: number, pFail: number): number {
  if (c + n + f !== N) return 0
  // N! / (c! n! f!) * pCrit^c * pNorm^n * pFail^f
  // compute combination via iterative multiplication to avoid overflow
  // Use log factorial
  const fact = (k: number) => {
    let r = 1
    for (let i = 2; i <= k; i++) r *= i
    return r
  }
  const coeff = fact(N) / (fact(c) * fact(n) * fact(f))
  return coeff * Math.pow(pCrit, c) * Math.pow(pNorm, n) * Math.pow(pFail, f)
}

function binomialProb(n: number, k: number, p: number): number {
  if (k < 0 || k > n) return 0
  let coeff = 1
  for (let i = 1; i <= k; i++) coeff = coeff * (n - i + 1) / i
  return coeff * Math.pow(p, k) * Math.pow(1 - p, n - k)
}

// Enumerate attacker final dice distribution after rerolls and attacker abilities
function attackerDistribution(att: Attacker): Map<string, number> {
  // key: "c,n" -> prob
  const N = att.attacks
  const { pCrit, pNorm, pFail } = effectiveDieProbs(att.bs, att.lethal, att.reroll === 'ceaseless' || att.reroll === 'balanced-ceaseless' ? att.reroll : 'none')
  // For relentless and balanced, we need to handle reroll enumeration
  const dist = new Map<string, number>()

  // Helper to apply attacker abilities to a (c,n,f) outcome
  function applyAbilities(c: number, n: number, f: number): { c: number, n: number } {
    let cc = c, nn = n, ff = f
    // Accurate: retain up to X fails as normals
    if (att.accurate > 0 && ff > 0) {
      const take = Math.min(att.accurate, ff)
      nn += take
      ff -= take
    }
    // Punishing: retain one fail as normal if you have 2+ successes? Simplified: if ff>0 and (cc+nn)>=1, retain one fail
    if (att.punishing && ff > 0 && (cc + nn) >= 1) {
      nn += 1
      // ff tracking not needed after this point (return only c/n)
    }
    // Severe: if no crits, change one normal to crit
    if (att.severe && cc === 0 && nn > 0) {
      nn -= 1
      cc += 1
    }
    // Rending: if >=1 crit, retain one normal as crit
    if (att.rending && cc >= 1 && nn > 0) {
      nn -= 1
      cc += 1
    }
    // Obscured: crits become normals
    if (att.defenderObscured) {
      // handled via defender flag, but we need to know defender obscured here
      // We'll handle obscured in attackerDistribution caller
    }
    return { c: cc, n: nn }
  }

  // We need to handle defender obscured outside, so add param
  // Instead, we will handle obscured after abilities but before returning

  if (att.reroll === 'none' || att.reroll === 'ceaseless') {
    for (let c = 0; c <= N; c++) {
      for (let n = 0; n <= N - c; n++) {
        const f = N - c - n
        const p = multinomialProb(N, c, n, f, pCrit, pNorm, pFail)
        if (p === 0) continue
        const { c: cc, n: nn } = applyAbilities(c, n, f)
        // obscured handled later
        const key = `${cc},${nn}`
        dist.set(key, (dist.get(key) || 0) + p)
      }
    }
  } else if (att.reroll === 'balanced' || att.reroll === 'balanced-ceaseless') {
    // Balanced: reroll one fail die if any fails
    // Enumerate initial outcome, then reroll one fail
    for (let c = 0; c <= N; c++) {
      for (let n = 0; n <= N - c; n++) {
        const f = N - c - n
        const pInit = multinomialProb(N, c, n, f, pCrit, pNorm, pFail)
        if (pInit === 0) continue
        if (f === 0) {
          const { c: cc, n: nn } = applyAbilities(c, n, f)
          const key = `${cc},${nn}`
          dist.set(key, (dist.get(key) || 0) + pInit)
        } else {
          // reroll one fail: with pCrit -> c+1, pNorm -> n+1, pFail -> stay
          const outcomes = [
            { dc: 1, dn: 0, p: pCrit },
            { dc: 0, dn: 1, p: pNorm },
            { dc: 0, dn: 0, p: pFail },
          ]
          for (const o of outcomes) {
            const c2 = c + o.dc
            const n2 = n + o.dn
            const f2 = f - 1 + (o.dc === 0 && o.dn === 0 ? 1 : 0)
            const { c: cc, n: nn } = applyAbilities(c2, n2, f2)
            const key = `${cc},${nn}`
            dist.set(key, (dist.get(key) || 0) + pInit * o.p)
          }
        }
      }
    }
  } else if (att.reroll === 'relentless') {
    // Relentless: reroll all fails
    for (let c = 0; c <= N; c++) {
      for (let n = 0; n <= N - c; n++) {
        const f = N - c - n
        const pInit = multinomialProb(N, c, n, f, pCrit, pNorm, pFail)
        if (pInit === 0) continue
        if (f === 0) {
          const { c: cc, n: nn } = applyAbilities(c, n, f)
          const key = `${cc},${nn}`
          dist.set(key, (dist.get(key) || 0) + pInit)
        } else {
          // each of f dice rerolled independently
          // enumerate reroll outcomes: cR crits, nR normals, fR fails among f dice
          for (let cr = 0; cr <= f; cr++) {
            for (let nr = 0; nr <= f - cr; nr++) {
              const fr = f - cr - nr
              const pReroll = multinomialProb(f, cr, nr, fr, pCrit, pNorm, pFail)
              if (pReroll === 0) continue
              const c2 = c + cr
              const n2 = n + nr
              const f2 = fr
              const { c: cc, n: nn } = applyAbilities(c2, n2, f2)
              const key = `${cc},${nn}`
              dist.set(key, (dist.get(key) || 0) + pInit * pReroll)
            }
          }
        }
      }
    }
  }

  return dist
}

// Extend Attacker with defender obscured flag for distribution
declare module './calculator' {
  interface Attacker {
    defenderObscured?: boolean
  }
}

function saveProb(save: number, piercing: number, indomitus: boolean): number {
  let eff = save + (indomitus ? 0 : piercing)
  eff = clamp(eff, 2, 7) // 7 means impossible (needs 7+)
  if (eff > 6) return 0
  return (7 - eff) / 6
}

export function calcDmgProbs(sit: Situation): Map<number, number> {
  const att = { ...sit.attacker, defenderObscured: sit.defender.obscured }
  const def = sit.defender

  // attacker distribution
  const attDist = attackerDistribution(att)

  // For each attacker outcome, compute defender save distribution
  const dmgMap = new Map<number, number>()

  for (const [key, pAtt] of attDist) {
    const [cStr, nStr] = key.split(',').map(Number)
    let c = cStr, n = nStr

    // Obscured: crits become normals
    if (def.obscured && c > 0) {
      n += c
      c = 0
    }

    // Cover saves: auto retain X saves as successes, prefer to block crits if critDmg > normalDmg
    let cBlockedByCover = 0
    let nBlockedByCover = 0
    if (def.coverSaves > 0) {
      if (att.critDmg > att.normalDmg) {
        cBlockedByCover = Math.min(c, def.coverSaves)
        nBlockedByCover = Math.min(n, def.coverSaves - cBlockedByCover)
      } else {
        nBlockedByCover = Math.min(n, def.coverSaves)
        cBlockedByCover = Math.min(c, def.coverSaves - nBlockedByCover)
      }
    }
    c -= cBlockedByCover
    n -= nBlockedByCover

    // Now defender rolls saves for remaining hits
    const pSaveCrit = saveProb(def.save, att.piercingCrits, def.indomitus)
    const pSaveNorm = saveProb(def.save, att.piercing, def.indomitus)

    // Enumerate save outcomes: savedCrits 0..c, savedNorms 0..n
    for (let sc = 0; sc <= c; sc++) {
      const pSC = binomialProb(c, sc, pSaveCrit)
      if (pSC === 0 && c > 0) continue
      for (let sn = 0; sn <= n; sn++) {
        const pSN = binomialProb(n, sn, pSaveNorm)
        if (pSN === 0 && n > 0) continue
        const pSave = pSC * pSN
        if (pSave === 0) continue
        const pTotal = pAtt * pSave

        const unsavedCrits = c - sc
        const unsavedNormals = n - sn

        // Damage calculation
        let dmg = unsavedCrits * att.critDmg + unsavedNormals * att.normalDmg
        const cBeforeCover = c + cBlockedByCover
        dmg += cBeforeCover * att.devastating

        // Just a Scratch: ignore one die
        if (def.jasCrits && unsavedCrits > 0) {
          dmg -= att.critDmg
          // if devastating was added, should we also ignore devastating? No, JaS ignores damage from one attack die, which includes its devastating? Simplify: ignore critDmg only
        } else if (def.jasNormals && unsavedNormals > 0) {
          // JaS normals only ignores normal hits
          dmg -= att.normalDmg
        } else if (def.jasCrits && unsavedNormals > 0 && unsavedCrits === 0) {
          // if no crits but JaS crits, does it do nothing? In reference, JaS Crits can ignore crits only, not normals
          // so no effect
        }

        dmg = Math.max(0, dmg)

        dmgMap.set(dmg, (dmgMap.get(dmg) || 0) + pTotal)
      }
    }

    // Edge case: if c=n=0, we still need to account for devastating? Already handled via cBeforeCover
    if (c === 0 && n === 0) {
      // This case already enumerated with sc=0,sn=0, but if we had cover blocked all, cBeforeCover may have devastating
      // The loop above with c=0,n=0 will run once with sc=0,sn=0, so it's covered
    }
  }

  // Handle rounds: convolve dmgMap with itself rounds times
  let result = dmgMap
  for (let r = 1; r < att.rounds; r++) {
    const next = new Map<number, number>()
    for (const [d1, p1] of result) {
      for (const [d2, p2] of dmgMap) {
        const d = d1 + d2
        next.set(d, (next.get(d) || 0) + p1 * p2)
      }
    }
    result = next
  }

  // Normalize (should sum to 1)
  let sum = 0
  for (const v of result.values()) sum += v
  if (sum > 0 && Math.abs(sum - 1) > 1e-9) {
    for (const [k, v] of result) result.set(k, v / sum)
  }

  return result
}

export function calcResult(sit: Situation): CalcResult {
  const dmgProbs = calcDmgProbs(sit)
  let avg = 0
  let kill = 0
  let injury = 0
  const injuryThreshold = 7 // fixed as per KT common wound threshold
  for (const [dmg, p] of dmgProbs) {
    avg += dmg * p
    if (dmg >= sit.defender.wounds) kill += p
    if (dmg >= injuryThreshold) injury += p
    // also if wounds <7, injury should be at least kill? but we keep threshold 7
    // Alternative: injury = dmg >0 ? but we use 7
  }
  // If wounds <=7, injury chance should be at least kill chance, but our threshold is 7, so if wounds=5, kill is dmg>=5, injury is dmg>=7, kill > injury possible
  // To ensure injury >= kill, define injury as dmg >= min(7, wounds) ??? Let's define injury as dmg >= 7 OR dmg >= wounds? Actually injury in KT is not kill, but we want injury >= kill
  // So set injury = max(P(dmg>=7), kill) ??? Simpler: injury = P(dmg >= Math.min(7, wounds))? Let's just set injury = P(dmg >0) if that is more intuitive
  // For now, if kill > injury, set injury = kill
  if (kill > injury) injury = kill

  const histogram = Array.from(dmgProbs.entries()).sort((a, b) => a[0] - b[0]).map(([dmg, prob]) => ({ dmg, prob }))
  return { avgDamage: avg, injuryChance: injury, killChance: kill, dmgProbs, histogram }
}

export function combinedKillChance(s1: Situation, s2: Situation, wounds: number): number {
  const d1 = calcDmgProbs(s1)
  const d2 = calcDmgProbs(s2)
  let kill = 0
  for (const [dmg1, p1] of d1) {
    for (const [dmg2, p2] of d2) {
      if (dmg1 + dmg2 >= wounds) kill += p1 * p2
    }
  }
  return kill
}

export function defaultAttacker(): Attacker {
  return {
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
  }
}

export function defaultDefender(): Defender {
  return {
    save: 3,
    wounds: 12,
    coverSaves: 1,
    indomitus: false,
    obscured: false,
    jasCrits: false,
    jasNormals: false,
  }
}
