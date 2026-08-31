import type { Attacker, Defender } from '../engine/calculator'

export type Mode = 'shoot' | 'fight'

export interface OperativePreset {
  id: string
  name: string
  faction: string
  role: string
  shoot: Attacker
  fight: Attacker
  defender: Defender
}
