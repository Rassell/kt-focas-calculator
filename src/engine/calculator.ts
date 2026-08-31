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
  indomitus: boolean
  jasCrits: boolean
  jasNormals: boolean
}

export interface Situation {
  attacker: Attacker
  defender: Defender
  coverSaves: number
  obscured: boolean
}

export interface CalcResult {
  avgDamage: number
  injuryChance: number
  killChance: number
  dmgProbs: Map<number, number>
  histogram: { dmg: number; prob: number }[]
}

// --- ktcalc vendored helpers ---

const Ability = {
  None: 'X',
  Balanced: 'Balanced',
  Relentless: 'Relentless',
  RerollOnes: 'Ones',
  RerollMostCommonFail: 'Ceaseless',
  RerollMostCommonFailPlusBalanced: 'CeaselessPlusBalanced',
  RerollOnesPlusBalanced: 'BothOnesAndBalanced',
  Severe: 'Severe',
  Rending: 'Rending',
  Punishing: 'Punishing',
  JustAScratch: 'JustAScratch',
  JustAScratchNorms: 'JustAScratchNorms',
  ObscuredTarget: 'ObscuredTarget',
  Indomitus: 'Indomitus',
  PuritySeal: 'PuritySeal',
} as const
type Ability = typeof Ability[keyof typeof Ability]

class DieProbs {
  crit: number
  norm: number
  fail: number
  constructor(crit: number, norm: number, fail: number = -1) {
    this.crit = crit
    this.norm = norm
    this.fail = fail === -1 ? 1 - crit - norm : fail
  }
  static fromSkills(critSkill: number, normSkill: number, reroll: Ability) {
    const effCritSkill = Math.max(critSkill, normSkill)
    let critHitProb = (7 - effCritSkill) / 6
    let normHitProb = Math.max(0, (effCritSkill - normSkill) / 6)
    let failHitProb = 1 - critHitProb - normHitProb
    if (reroll === Ability.RerollOnes || reroll === Ability.Relentless || reroll === Ability.RerollOnesPlusBalanced) {
      const rerollMultiplier = reroll === Ability.Relentless ? 1 + failHitProb : 7 / 6
      critHitProb *= rerollMultiplier
      normHitProb *= rerollMultiplier
      failHitProb = 1 - critHitProb - normHitProb
    }
    return new DieProbs(critHitProb, normHitProb, failHitProb)
  }
}

class FinalDiceProb {
  prob: number
  crits: number
  norms: number
  constructor(prob: number, crits: number, norms: number) {
    this.prob = prob
    this.crits = crits
    this.norms = norms
  }
}

function factorial(n: number): number {
  let r = 1
  for (let i = 2; i <= n; i++) r *= i
  return r
}
function upTo(first: number, last?: number): number[] {
  if (last === undefined) return Array.from({ length: first + 1 }, (_, i) => i)
  if (first > last) return []
  const arr: number[] = []
  for (let i = first; i <= last; i++) arr.push(i)
  return arr
}
function addToMapValue<T>(map: Map<T, number>, key: T, val: number): void {
  map.set(key, (map.get(key) ?? 0) + val)
}
function _range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i)
}
void _range

// --- CalcEngineCommon vendored ---

function calcFinalDiceProbs(
  singleDieProbs: DieProbs,
  numDice: number,
  reroll: Ability,
  autoCrits: number = 0,
  autoNorms: number = 0,
  failsToNorms: number = 0,
  normsToCrits: number = 0,
  abilities: Set<Ability> = new Set(),
  normDmg: number = 0,
  critDmgPlusMwx: number = 0,
): FinalDiceProb[] {
  return bestAutoNormPlan(singleDieProbs, numDice, reroll, autoCrits, autoNorms, failsToNorms, normsToCrits, abilities, normDmg, critDmgPlusMwx).probs
}

function buildFinalDiceProbs(
  singleDieProbs: DieProbs,
  rolledDice: number,
  reroll: Ability,
  autoCrits: number,
  usedAutoNorms: number,
  failsToNorms: number,
  normsToCrits: number,
  abilities: Set<Ability>,
  normDmg: number,
  critDmgPlusMwx: number,
): FinalDiceProb[] {
  const finalDiceProbs: FinalDiceProb[] = []
  for (let crits = 0; crits <= rolledDice; crits++) {
    for (let norms = 0; norms <= rolledDice - crits; norms++) {
      const fails = rolledDice - crits - norms
      const finalDiceProb = calcFinalDiceProb(singleDieProbs, crits, norms, fails, reroll, autoCrits, usedAutoNorms, failsToNorms, normsToCrits, abilities, normDmg, critDmgPlusMwx)
      if (finalDiceProb.prob > 0) finalDiceProbs.push(finalDiceProb)
    }
  }
  return finalDiceProbs
}

function bestAutoNormPlan(
  singleDieProbs: DieProbs,
  numDice: number,
  reroll: Ability,
  autoCrits: number,
  autoNorms: number,
  failsToNorms: number,
  normsToCrits: number,
  abilities: Set<Ability>,
  normDmg: number,
  critDmgPlusMwx: number,
): { used: number; probs: FinalDiceProb[] } {
  const cappedAutoCrits = Math.min(autoCrits, numDice)
  const diceAfterAutoCrits = numDice - cappedAutoCrits
  const maxAutoNorms = Math.min(autoNorms, diceAfterAutoCrits)
  const build = (used: number) => buildFinalDiceProbs(singleDieProbs, diceAfterAutoCrits - used, reroll, cappedAutoCrits, used, failsToNorms, normsToCrits, abilities, normDmg, critDmgPlusMwx)
  if (maxAutoNorms === 0 || !canRankByDamage(normDmg, critDmgPlusMwx)) {
    return { used: maxAutoNorms, probs: build(maxAutoNorms) }
  }
  let best = { used: maxAutoNorms, probs: [] as FinalDiceProb[] }
  let bestValue = -Infinity
  for (let used = maxAutoNorms; used >= 0; used--) {
    const probs = build(used)
    const value = expectedDiceValue(probs, normDmg, critDmgPlusMwx)
    if (value > bestValue) {
      bestValue = value
      best = { used, probs }
    }
  }
  return best
}

function canRankByDamage(normDmg: number, critDmgPlusMwx: number): boolean {
  return normDmg > 0 || critDmgPlusMwx > 0
}
function expectedDiceValue(finalDiceProbs: FinalDiceProb[], normDmg: number, critDmgPlusMwx: number): number {
  let total = 0
  for (const fdp of finalDiceProbs) total += fdp.prob * (fdp.crits * critDmgPlusMwx + fdp.norms * normDmg)
  return total
}

function calcFinalDiceProb(
  dieProbs: DieProbs,
  crits: number,
  norms: number,
  fails: number,
  reroll: Ability = Ability.None,
  additionalCrits: number = 0,
  additionalNorms: number = 0,
  failsToNorms: number = 0,
  normsToCrits: number = 0,
  abilities: Set<Ability> = new Set(),
  normDmg: number = 0,
  critDmgPlusMwx: number = 0,
): FinalDiceProb {
  let prob: number
  if (reroll === Ability.Balanced) prob = calcFinalDiceProbBalanced(dieProbs, crits, norms, fails, 1)
  else if (reroll === Ability.RerollMostCommonFail) prob = calcFinalDiceProbRerollMostCommonFail(dieProbs, crits, norms, fails)
  else if (reroll === Ability.RerollMostCommonFailPlusBalanced) prob = calcFinalDiceProbRerollMostCommonFailPlusBalanced(dieProbs, crits, norms, fails)
  else prob = calcMultiRollProb(dieProbs, crits, norms, fails)

  if (reroll === Ability.RerollOnesPlusBalanced) {
    const probRollBeforeBalanced = prob
    const probSingleFailCanNotBeRerolled = 1 / 7 + 1 / (42 * dieProbs.fail)
    const nonRerollOnesProbCrit = dieProbs.crit * 6 / 7
    const nonRerollOnesProbNorm = dieProbs.norm * 6 / 7
    const nonRerollOnesProbFail = 1 - nonRerollOnesProbCrit - nonRerollOnesProbNorm
    if (fails > 0) {
      const conditionalProbNoneCanBeRerolled = Math.pow(probSingleFailCanNotBeRerolled, fails)
      prob *= conditionalProbNoneCanBeRerolled
      prob += probRollBeforeBalanced * (1 - conditionalProbNoneCanBeRerolled) * nonRerollOnesProbFail
    }
    if (crits > 0) {
      const conditionalProbSomeCanBeRerolled = 1 - Math.pow(probSingleFailCanNotBeRerolled, fails + 1)
      prob += calcMultiRollProb(dieProbs, crits - 1, norms, fails + 1) * conditionalProbSomeCanBeRerolled * nonRerollOnesProbCrit
    }
    if (norms > 0) {
      const conditionalProbSomeCanBeRerolled = 1 - Math.pow(probSingleFailCanNotBeRerolled, fails + 1)
      prob += calcMultiRollProb(dieProbs, crits, norms - 1, fails + 1) * conditionalProbSomeCanBeRerolled * nonRerollOnesProbNorm
    }
  }
  const modified = applyPostRollModifications(crits, norms, fails, additionalCrits, additionalNorms, failsToNorms, normsToCrits, abilities, normDmg, critDmgPlusMwx)
  return new FinalDiceProb(prob, modified.crits, modified.norms)
}

function calcMultiRollProb(dieProbs: DieProbs, numCrits: number, numNorms: number, numFails: number): number {
  return Math.pow(dieProbs.crit, numCrits) * Math.pow(dieProbs.norm, numNorms) * Math.pow(dieProbs.fail, numFails) * factorial(numCrits + numNorms + numFails) / factorial(numCrits) / factorial(numNorms) / factorial(numFails)
}

function calcFinalDiceProbBalanced(dieProbs: DieProbs, finalCrits: number, finalNorms: number, finalFails: number, balancedCount: number): number {
  let prob = 0
  const minRerolls = Math.min(finalFails, balancedCount)
  const maxRerolls = balancedCount
  for (const rerolls of upTo(minRerolls, maxRerolls)) {
    for (const rerolledCrits of upTo(Math.min(finalCrits, rerolls))) {
      const minRerolledNorms = Math.max(0, rerolls - rerolledCrits - finalFails)
      const maxRerolledNorms = Math.min(finalNorms, rerolls - rerolledCrits - (rerolls < balancedCount ? finalFails : 0))
      for (const rerolledNorms of upTo(minRerolledNorms, maxRerolledNorms)) {
        const rerolledFails = rerolls - rerolledCrits - rerolledNorms
        const origCrits = finalCrits - rerolledCrits
        const origNorms = finalNorms - rerolledNorms
        const origFails = finalFails + rerolledNorms + rerolledCrits
        const preBalancedProb = calcMultiRollProb(dieProbs, origCrits, origNorms, origFails)
        const balancedRollsProb = calcMultiRollProb(dieProbs, rerolledCrits, rerolledNorms, rerolledFails)
        prob += preBalancedProb * balancedRollsProb
      }
    }
  }
  return prob
}

function calcFinalDiceProbRerollMostCommonFail(dieProbs: DieProbs, finalCrits: number, finalNorms: number, finalFails: number): number {
  let prob = 0
  const numFailFaces = Math.round(dieProbs.fail * 6)
  const numDice = finalCrits + finalNorms + finalFails
  const minRerolls = Math.ceil(finalFails / Math.max(1, numFailFaces))
  const maxRerolls = numDice
  for (const rerolls of upTo(minRerolls, maxRerolls)) {
    for (const rerolledCrits of upTo(Math.min(finalCrits, rerolls))) {
      const minRerolledNorms = Math.max(0, rerolls - rerolledCrits - finalFails)
      const maxRerolledNorms = Math.min(finalNorms, rerolls - rerolledCrits)
      for (const rerolledNorms of upTo(minRerolledNorms, maxRerolledNorms)) {
        const rerolledFails = rerolls - rerolledCrits - rerolledNorms
        const origCrits = finalCrits - rerolledCrits
        const origNorms = finalNorms - rerolledNorms
        const origFails = finalFails + rerolledNorms + rerolledCrits
        const probOfNumRerolls = getProbOfNumTediousRerolls(numFailFaces, origFails, rerolls)
        const preRerollProb = calcMultiRollProb(dieProbs, origCrits, origNorms, origFails)
        const rerollProb = calcMultiRollProb(dieProbs, rerolledCrits, rerolledNorms, rerolledFails)
        prob += probOfNumRerolls * preRerollProb * rerollProb
      }
    }
  }
  return prob
}

function calcFinalDiceProbRerollMostCommonFailPlusBalanced(dieProbs: DieProbs, finalCrits: number, finalNorms: number, finalFails: number): number {
  let totalProb = 0
  const numFailFaces = Math.round(dieProbs.fail * 6)
  const numDice = finalCrits + finalNorms + finalFails
  for (let bCrits = Math.max(0, finalCrits - 1); bCrits <= Math.min(numDice, finalCrits + 1); bCrits++) {
    for (let bNorms = Math.max(0, finalNorms - 1); bNorms <= Math.min(numDice - bCrits, finalNorms + 1); bNorms++) {
      const bFails = numDice - bCrits - bNorms
      if (bFails < 0) continue
      const critDiff = finalCrits - bCrits
      const normDiff = finalNorms - bNorms
      const failDiff = finalFails - bFails
      if (Math.abs(critDiff) + Math.abs(normDiff) + Math.abs(failDiff) > 2) continue
      let targetType: 'fail' | 'none'
      let balancedOutcomeProb: number
      if (critDiff === 0 && normDiff === 0 && failDiff === 0) { targetType = 'none'; balancedOutcomeProb = 1 }
      else if (critDiff === 1 && normDiff === 0 && failDiff === -1) { targetType = 'fail'; balancedOutcomeProb = dieProbs.crit }
      else if (critDiff === 0 && normDiff === 1 && failDiff === -1) { targetType = 'fail'; balancedOutcomeProb = dieProbs.norm }
      else continue
      const minRerolls = Math.ceil(bFails / Math.max(1, numFailFaces))
      const maxRerolls = numDice
      for (const rerolls of upTo(minRerolls, maxRerolls)) {
        for (const rerolledCrits of upTo(Math.min(bCrits, rerolls))) {
          const minRerolledNorms = Math.max(0, rerolls - rerolledCrits - bFails)
          const maxRerolledNorms = Math.min(bNorms, rerolls - rerolledCrits)
          for (const rerolledNorms of upTo(minRerolledNorms, maxRerolledNorms)) {
            const rerolledFails = rerolls - rerolledCrits - rerolledNorms
            const origCrits = bCrits - rerolledCrits
            const origNorms = bNorms - rerolledNorms
            const origFails = bFails + rerolledCrits + rerolledNorms
            const availFails = origFails - rerolls
            if (availFails < 0) continue
            const probOfNumRerolls = getProbOfNumTediousRerolls(numFailFaces, origFails, rerolls)
            const preRerollProb = calcMultiRollProb(dieProbs, origCrits, origNorms, origFails)
            const rerollProb = calcMultiRollProb(dieProbs, rerolledCrits, rerolledNorms, rerolledFails)
            const ceaselessProb = probOfNumRerolls * preRerollProb * rerollProb
            if (targetType === 'none') {
              if (availFails > 0) totalProb += ceaselessProb * dieProbs.fail
              else totalProb += ceaselessProb
            } else if (targetType === 'fail') {
              if (availFails <= 0) continue
              totalProb += ceaselessProb * balancedOutcomeProb
            }
          }
        }
      }
    }
  }
  return totalProb
}

const TediousRerollCountProbs = new Map<number, Map<number, number[]>>()
function getProbOfNumTediousRerolls(numFailTypes: number, numOrigFails: number, numRerolls: number): number {
  let probsForNumFailType = TediousRerollCountProbs.get(numFailTypes)
  if (probsForNumFailType === undefined) {
    probsForNumFailType = new Map()
    TediousRerollCountProbs.set(numFailTypes, probsForNumFailType)
  }
  let rerollCountProbs = probsForNumFailType.get(numOrigFails)
  if (rerollCountProbs !== undefined) return rerollCountProbs[numRerolls] ?? 0
  rerollCountProbs = new Array<number>(numOrigFails + 1).fill(0)
  probsForNumFailType.set(numOrigFails, rerollCountProbs)
  const failTypeCounts = new Array<number>(numFailTypes).fill(0)
  failTypeCounts[0] = numOrigFails
  const commonProbFactor = Math.pow(numFailTypes, -numOrigFails) * factorial(numOrigFails) * factorial(numFailTypes)
  do {
    let divisor = 1
    for (const c of failTypeCounts) divisor *= factorial(c)
    const hist = calcHistogramArray(failTypeCounts)
    for (const v of hist) divisor *= factorial(v)
    const numRerollsAchieved = failTypeCounts[0]
    rerollCountProbs[numRerollsAchieved] += commonProbFactor / divisor
  } while (changeToNextDescendingSequenceWithSameSum(failTypeCounts))
  return rerollCountProbs[numRerolls] ?? 0
}
function calcHistogramArray(vals: number[]): number[] {
  const maxVal = Math.max(...vals)
  const histogram = new Array<number>(maxVal + 1).fill(0)
  for (const v of vals) histogram[v]++
  return histogram
}
function changeToNextDescendingSequenceWithSameSum(vals: number[]): boolean {
  if (vals[1] + 1 < vals[0]) { vals[0]--; vals[1]++; return true }
  for (let i = 2; i < vals.length; i++) {
    if (vals[i] < vals[i - 1] && vals[i] + 1 < vals[0]) {
      const commonVal = ++vals[i]
      let val0Increment = -1
      for (let j = 1; j < i; j++) { val0Increment += vals[j] - commonVal; vals[j] = commonVal }
      vals[0] += val0Increment
      return true
    }
  }
  return false
}

function applyPostRollModifications(
  crits: number, norms: number, fails: number,
  additionalCrits: number, additionalNorms: number,
  failsToNorms: number, normsToCrits: number,
  abilities: Set<Ability>, normDmg: number = 0, critDmgPlusMwx: number = 0,
): { crits: number; norms: number } {
  crits += additionalCrits
  const retainedNorms = additionalNorms
  norms += additionalNorms
  const punishingAvailable = abilities.has(Ability.Punishing) && !abilities.has(Ability.ObscuredTarget) && crits > 0 && fails > 0
  const resolve = (c: number, n: number, f: number, retained: number) => resolveAfterPunishing(c, n, f, retained, failsToNorms, normsToCrits, abilities)
  if (!punishingAvailable) return resolve(crits, norms, fails, retainedNorms)
  const taken = resolve(crits, norms + 1, fails - 1, retainedNorms + 1)
  const declined = resolve(crits, norms, fails, retainedNorms)
  return _outcomeValue(declined, normDmg, critDmgPlusMwx) > _outcomeValue(taken, normDmg, critDmgPlusMwx) ? declined : taken
}
function _outcomeValue(outcome: { crits: number; norms: number }, normDmg: number, critDmgPlusMwx: number): number {
  const useFallback = !canRankByDamage(normDmg, critDmgPlusMwx)
  const critValue = useFallback ? 2 : critDmgPlusMwx
  const normValue = useFallback ? 1 : normDmg
  return outcome.crits * critValue + outcome.norms * normValue
}
function resolveAfterPunishing(
  crits: number, norms: number, fails: number, retainedNorms: number,
  failsToNorms: number, normsToCrits: number, abilities: Set<Ability>,
): { crits: number; norms: number } {
  if (abilities.has(Ability.PuritySeal) || abilities.has(Ability.Indomitus)) {
    if (fails >= 2) { norms++; fails -= 2 }
  }
  const actualFailToNormPromotions = Math.min(failsToNorms, fails)
  norms += actualFailToNormPromotions
  fails = fails - actualFailToNormPromotions
  void fails
  let severeTriggered = false
  if (abilities.has(Ability.Severe)) {
    if (norms > 0 && crits === 0) { crits++; norms--; retainedNorms = Math.max(0, retainedNorms - 1); severeTriggered = true }
  }
  const promotableNorms = Math.max(0, norms - retainedNorms)
  const actualNormToCritPromotions = Math.min(normsToCrits, promotableNorms)
  crits += actualNormToCritPromotions
  norms -= actualNormToCritPromotions
  return finishRendingAndObscured(crits, norms, retainedNorms, severeTriggered, abilities)
}
function finishRendingAndObscured(crits: number, norms: number, retainedNorms: number, severeTriggered: boolean, abilities: Set<Ability>): { crits: number; norms: number } {
  if (abilities.has(Ability.Rending) && !severeTriggered) {
    const rollableNorms = Math.max(0, norms - retainedNorms)
    if (crits > 0 && rollableNorms > 0) { crits++; norms-- }
  }
  if (abilities.has(Ability.ObscuredTarget)) { norms = Math.max(0, norms + crits - 1); crits = 0 }
  return { crits, norms }
}

// --- Defender helpers ---

function _calcDefenderFinalDiceStuff(defenderDice: number, defenderSave: number, defenderAbilities: Set<Ability>, attackerApx: number, attackerPx: number) {
  const defenderSingleDieProbs = DieProbs.fromSkills(6, defenderSave, Ability.None)
  const numDefDiceWithoutPx = Math.max(0, defenderDice - attackerApx)
  const defenderAbilitiesForSaves = new Set(defenderAbilities)
  defenderAbilitiesForSaves.delete(Ability.ObscuredTarget)
  const defenderFinalDiceProbs = calcFinalDiceProbs(defenderSingleDieProbs, numDefDiceWithoutPx, Ability.None, 0, 0, 0, 0, defenderAbilitiesForSaves)
  let defenderFinalDiceProbsWithPx: FinalDiceProb[] = []
  const effectivePx = attackerApx >= attackerPx ? 0 : attackerPx
  const pxIsRelevant = effectivePx > 0
  if (pxIsRelevant) {
    const numDefDiceWithPx = Math.max(0, defenderDice - effectivePx)
    defenderFinalDiceProbsWithPx = calcFinalDiceProbs(defenderSingleDieProbs, numDefDiceWithPx, Ability.None, 0, 0, 0, 0, defenderAbilitiesForSaves)
  }
  return { defenderFinalDiceProbs, defenderFinalDiceProbsWithPx, pxIsRelevant }
}

interface DamageResult { damage: number; numHits: number; survivingCritHits: number; survivingNormHits: number }

function calcDamage(attacker: Attacker, defenderAbilities: Set<Ability>, critHits: number, normHits: number, critSaves: number, normSaves: number): DamageResult {
  const originalCritHits = critHits
  let damage = critHits * attacker.devastating
  const numNormalSavesToCancelCritHit = 2
  function critSavesCancelCritHits() { const n = Math.min(critSaves, critHits); critSaves -= n; critHits -= n }
  function critSavesCancelNormHits() { const n = Math.min(critSaves, normHits); critSaves -= n; normHits -= n }
  function normSavesCancelNormHits() { const n = Math.min(normSaves, normHits); normSaves -= n; normHits -= n }
  function normSavesCancelCritHits() { const n = Math.min((normSaves / numNormalSavesToCancelCritHit) >> 0, critHits); normSaves -= n * numNormalSavesToCancelCritHit; critHits -= n }

  if (defenderAbilities.has(Ability.JustAScratch)) {
    if (critHits > 0) critHits--
    else if (normHits > 0) normHits--
  }
  if (defenderAbilities.has(Ability.JustAScratchNorms)) {
    if (normHits > 0) normHits--
  }

  if (attacker.critDmg >= attacker.normalDmg) {
    critSavesCancelCritHits()
    critSavesCancelNormHits()
    if (attacker.critDmg > 2 * attacker.normalDmg) {
      normSavesCancelCritHits()
      normSavesCancelNormHits()
    } else {
      if (normSaves > normHits && normSaves >= numNormalSavesToCancelCritHit && critHits > 0) {
        normSaves -= numNormalSavesToCancelCritHit
        critHits--
      }
      normSavesCancelNormHits()
      normSavesCancelCritHits()
    }
  } else {
    normSavesCancelNormHits()
    critSavesCancelNormHits()
    critSavesCancelCritHits()
    normSavesCancelCritHits()
  }

  damage += critHits * attacker.critDmg + normHits * attacker.normalDmg
  void attacker.normalDmg
  const mwxCancelledCrits = attacker.devastating > 0 ? (originalCritHits - critHits) : 0
  const numHits = critHits + normHits + mwxCancelledCrits
  return { damage, numHits, survivingCritHits: critHits, survivingNormHits: normHits }
}
void _calcDefenderFinalDiceStuff

function fillInProbForZero(map: Map<number, number>): void {
  let sum = 0
  for (const [k, v] of map) if (k !== 0) sum += v
  if (sum < 1) map.set(0, 1 - sum)
}

function calcMultiRoundDamage(dmgsSingleRound: Map<number, number>, numRounds: number): Map<number, number> {
  let dmgsCumulative = new Map(dmgsSingleRound)
  for (let i = 1; i < numRounds; i++) {
    const next = new Map<number, number>()
    for (const [d1, p1] of dmgsCumulative) for (const [d2, p2] of dmgsSingleRound) addToMapValue(next, d1 + d2, p1 * p2)
    dmgsCumulative = next
  }
  return dmgsCumulative
}

// --- Public API ---

function mapReroll(r: Reroll): Ability {
  switch (r) {
    case 'balanced': return Ability.Balanced
    case 'relentless': return Ability.Relentless
    case 'ceaseless': return Ability.RerollMostCommonFail
    case 'balanced-ceaseless': return Ability.RerollMostCommonFailPlusBalanced
    default: return Ability.None
  }
}

export function calcDmgProbs(sit: Situation): Map<number, number> {
  const att = sit.attacker
  const def = sit.defender

  // Build attacker abilities
  const attackerAbilities = new Set<Ability>()
  if (att.rending) attackerAbilities.add(Ability.Rending)
  if (att.severe) attackerAbilities.add(Ability.Severe)
  if (att.punishing) attackerAbilities.add(Ability.Punishing)
  if (sit.obscured) attackerAbilities.add(Ability.ObscuredTarget)

  // Attacker dice probs
  const critSkill = att.lethal ? 5 : 0
  const attackerSingleDieProbs = DieProbs.fromSkills(critSkill || 6, att.bs, mapReroll(att.reroll))

  // Defender abilities
  const defenderAbilities = new Set<Ability>()
  if (def.jasCrits) defenderAbilities.add(Ability.JustAScratch)
  if (def.jasNormals) defenderAbilities.add(Ability.JustAScratchNorms)
  if (def.indomitus) defenderAbilities.add(Ability.Indomitus)
  if (sit.obscured) defenderAbilities.add(Ability.ObscuredTarget)

  // Attacker final dice probs (with cover? No, cover is defender)
  // For attacker, autoNorms = accurate, autoCrits =0, failsToNorms=0, normsToCrits=0
  const attackerFinalDiceProbs = calcFinalDiceProbs(
    attackerSingleDieProbs,
    att.attacks,
    mapReroll(att.reroll),
    0,
    att.accurate,
    0,
    0,
    attackerAbilities,
    att.normalDmg,
    att.critDmg + att.devastating,
  )

  // Defender final dice stuff: defender always has 3 dice, plus cover autoNorms
  const defenderDice = 3
  const coverAutoNorms = sit.coverSaves
  // Defender cover is autoNorms, but we need to handle it via calcFinalDiceProbs with autoNorms
  // So we need to compute defender probs with cover included
  // We'll compute two variants: without Px and with Px, both with cover
  const defenderSingleDieProbs = DieProbs.fromSkills(6, def.save, Ability.None)
  const numDefDiceWithoutPx = Math.max(0, defenderDice - att.piercing)
  const numDefDiceWithPx = Math.max(0, defenderDice - (att.piercing >= att.piercingCrits ? 0 : att.piercingCrits))
  const effectivePx = att.piercing >= att.piercingCrits ? 0 : att.piercingCrits
  const pxIsRelevant = effectivePx > 0

  // Defender abilities for saves (without Obscured)
  const defenderAbilitiesForSaves = new Set(defenderAbilities)
  defenderAbilitiesForSaves.delete(Ability.ObscuredTarget)

  const defenderFinalDiceProbs = calcFinalDiceProbs(defenderSingleDieProbs, numDefDiceWithoutPx, Ability.None, 0, coverAutoNorms, 0, 0, defenderAbilitiesForSaves)
  let defenderFinalDiceProbsWithPx: FinalDiceProb[] = []
  if (pxIsRelevant) {
    defenderFinalDiceProbsWithPx = calcFinalDiceProbs(defenderSingleDieProbs, numDefDiceWithPx, Ability.None, 0, coverAutoNorms, 0, 0, defenderAbilitiesForSaves)
  }

  const dmgMap = new Map<number, number>()

  // If attacker has 0 dice, damage is 0
  if (att.attacks === 0) {
    dmgMap.set(0, 1)
  } else {
    for (const atk of attackerFinalDiceProbs) {
      if (atk.crits + atk.norms <= 0) continue
      const defs = (pxIsRelevant && atk.crits > 0) ? defenderFinalDiceProbsWithPx : defenderFinalDiceProbs
      for (const defProb of defs) {
        const result = calcDamage(att, defenderAbilities, atk.crits, atk.norms, defProb.crits, defProb.norms)
        const p = atk.prob * defProb.prob
        addToMapValue(dmgMap, result.damage, p)
      }
    }
    fillInProbForZero(dmgMap)
  }

  // Handle rounds
  let result = dmgMap
  if (att.rounds > 1) {
    result = calcMultiRoundDamage(dmgMap, att.rounds)
  }

  // Normalize
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
  const injuryThreshold = sit.defender.wounds / 2
  for (const [dmg, p] of dmgProbs) {
    avg += dmg * p
    if (dmg >= sit.defender.wounds) kill += p
    if (dmg > injuryThreshold && dmg < sit.defender.wounds) injury += p
  }
  const histogram = Array.from(dmgProbs.entries()).sort((a, b) => a[0] - b[0]).map(([dmg, prob]) => ({ dmg, prob }))
  return { avgDamage: avg, injuryChance: injury, killChance: kill, dmgProbs, histogram }
}

export function combinedKillChance(s1: Situation, s2: Situation, wounds: number): number {
  const d1 = calcDmgProbs(s1)
  const d2 = calcDmgProbs(s2)
  let kill = 0
  for (const [dmg1, p1] of d1) for (const [dmg2, p2] of d2) if (dmg1 + dmg2 >= wounds) kill += p1 * p2
  return kill
}

export function defaultAttacker(): Attacker {
  return { attacks: 4, bs: 3, normalDmg: 3, critDmg: 4, devastating: 0, piercing: 0, piercingCrits: 0, reroll: 'none', lethal: false, accurate: 0, rending: false, severe: false, punishing: false, rounds: 1 }
}
export function defaultDefender(): Defender {
  return { save: 3, wounds: 12, indomitus: false, jasCrits: false, jasNormals: false }
}
export function defaultSituation(): Situation {
  return { attacker: defaultAttacker(), defender: defaultDefender(), coverSaves: 0, obscured: false }
}
