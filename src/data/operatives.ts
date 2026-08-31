import type { Attacker, Defender } from '../engine/calculator'
import type { Mode, OperativePreset } from '../types/operative'
import operativesData from './operatives.json'

export const operatives = operativesData as OperativePreset[]

export function toAttacker(op: OperativePreset, mode: Mode): Attacker {
  return mode === 'shoot' ? op.shoot : op.fight
}

export function toDefender(op: OperativePreset): Defender {
  return op.defender
}
