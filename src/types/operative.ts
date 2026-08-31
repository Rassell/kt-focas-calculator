import type { Attacker, Defender } from '../engine/calculator'

export type Mode = 'shoot' | 'fight'

export interface Profile extends Omit<Attacker, 'lethal'> {
  id: string
  name: string
  // JSON may encode lethal as "5+" string; engine uses boolean
  lethal: boolean | string
  brutal?: boolean
}

export interface Weapon {
  id: string
  name: string
  profiles: Profile[]
}

export interface Operative {
  id: string
  name: string
  ranged: Weapon[]
  melee: Weapon[]
  defender: Defender
}

export interface FactionGroup {
  id: string
  name: string
  operatives: Operative[]
}

// Backwards compat alias — prefer Operative
export type OperativePreset = Operative
