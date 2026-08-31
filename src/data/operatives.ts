import type { Attacker, Defender } from '../engine/calculator'
import type { FactionGroup, Mode, Operative, Profile, Weapon } from '../types/operative'
import operativesData from './operatives.json'

export const factionGroups = operativesData as FactionGroup[]

export const operatives: Operative[] = factionGroups.flatMap(g => g.operatives)

const operativeFactionMap = new Map<string, string>()
for (const g of factionGroups) {
  for (const op of g.operatives) operativeFactionMap.set(op.id, g.name)
}

export function getOperativeFaction(operativeId: string): string {
  return operativeFactionMap.get(operativeId) ?? ''
}

export function findOperative(id: string): Operative | null {
  return operatives.find(o => o.id === id) ?? null
}

export function getWeapons(op: Operative, mode: Mode): Weapon[] {
  return mode === 'shoot' ? op.ranged : op.melee
}

export function getWeapon(op: Operative, weaponId: string): Weapon | null {
  return [...op.ranged, ...op.melee].find(w => w.id === weaponId) ?? null
}

export function getProfile(op: Operative, weaponId: string, profileId: string): Profile | null {
  const w = getWeapon(op, weaponId)
  if (!w) return null
  return w.profiles.find(p => p.id === profileId) ?? null
}

function normalizeLethal(v: boolean | string): boolean {
  if (typeof v === 'string') return v === '5+' || v.toLowerCase() === 'true'
  return v
}

export function toAttacker(profile: Profile): Attacker {
  const { id: _id, name: _name, brutal: _brutal, lethal, ...rest } = profile as unknown as Profile & { id: string; name: string; brutal?: boolean }
  void _id; void _name; void _brutal
  return { ...rest, lethal: normalizeLethal(lethal) } as Attacker
}

export function toDefender(op: Operative): Defender {
  return op.defender
}
