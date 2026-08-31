import { describe, it, expect } from 'vitest'
import {
  factionGroups,
  operatives,
  findOperative,
  getOperativeFaction,
  getWeapons,
  getWeapon,
  getProfile,
  toAttacker,
  toDefender,
} from './operatives'
import type { Reroll } from '../engine/calculator'

const validRerolls: Reroll[] = ['none', 'balanced', 'relentless', 'ceaseless', 'balanced-ceaseless']

describe('operatives.json shape', () => {
  it('factionGroups is non-empty and each has operatives', () => {
    expect(factionGroups.length).toBeGreaterThan(0)
    for (const g of factionGroups) {
      expect(g.id).toBeTruthy()
      expect(g.name).toBeTruthy()
      expect(g.operatives.length).toBeGreaterThan(0)
    }
  })

  it('operatives is flat list of all faction operatives', () => {
    const total = factionGroups.reduce((a, g) => a + g.operatives.length, 0)
    expect(operatives.length).toBe(total)
  })

  it('no duplicate operative ids', () => {
    const ids = operatives.map(o => o.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('no duplicate weapon ids within an operative', () => {
    for (const op of operatives) {
      const rangedIds = op.ranged.map(w => w.id)
      expect(new Set(rangedIds).size).toBe(rangedIds.length)
      const meleeIds = op.melee.map(w => w.id)
      expect(new Set(meleeIds).size).toBe(meleeIds.length)
    }
  })

  it('no duplicate profile ids within a weapon', () => {
    for (const op of operatives) {
      for (const w of [...op.ranged, ...op.melee]) {
        const pids = w.profiles.map(p => p.id)
        expect(new Set(pids).size).toBe(pids.length)
      }
    }
  })

  it('every profile satisfies Attacker constraints', () => {
    for (const op of operatives) {
      for (const w of [...op.ranged, ...op.melee]) {
        for (const p of w.profiles) {
          expect(p.attacks).toBeGreaterThanOrEqual(0)
          expect(p.bs).toBeGreaterThanOrEqual(2)
          expect(p.bs).toBeLessThanOrEqual(6)
          expect(p.normalDmg).toBeGreaterThanOrEqual(0)
          expect(p.critDmg).toBeGreaterThanOrEqual(p.normalDmg)
          expect(p.devastating).toBeGreaterThanOrEqual(0)
          expect(p.piercing).toBeGreaterThanOrEqual(0)
          expect(p.piercingCrits).toBeGreaterThanOrEqual(0)
          expect(validRerolls).toContain(p.reroll)
          expect(p.accurate).toBeGreaterThanOrEqual(0)
          expect(typeof p.rending).toBe('boolean')
          expect(typeof p.severe).toBe('boolean')
          expect(typeof p.punishing).toBe('boolean')
          expect(p.rounds).toBeGreaterThanOrEqual(1)
          // lethal may be boolean or "5+" string in JSON
          expect(['boolean', 'string'].includes(typeof p.lethal)).toBe(true)
        }
      }
    }
  })

  it('every defender satisfies Defender constraints', () => {
    for (const op of operatives) {
      const d = op.defender
      expect(d.save).toBeGreaterThanOrEqual(2)
      expect(d.save).toBeLessThanOrEqual(6)
      expect(d.wounds).toBeGreaterThan(0)
      expect(typeof d.indomitus).toBe('boolean')
      expect(typeof d.jasCrits).toBe('boolean')
      expect(typeof d.jasNormals).toBe('boolean')
    }
  })
})

describe('operatives helpers', () => {
  it('findOperative returns operative or null', () => {
    const first = operatives[0]
    expect(findOperative(first.id)).toEqual(first)
    expect(findOperative('nonexistent-id-xyz')).toBeNull()
  })

  it('getOperativeFaction returns faction name', () => {
    const first = operatives[0]
    const faction = getOperativeFaction(first.id)
    expect(faction).toBeTruthy()
    expect(factionGroups.some(g => g.name === faction)).toBe(true)
    expect(getOperativeFaction('nonexistent')).toBe('')
  })

  it('getWeapons returns ranged for shoot and melee for fight', () => {
    const op = operatives.find(o => o.ranged.length > 0 && o.melee.length > 0) ?? operatives[0]
    expect(getWeapons(op, 'shoot')).toBe(op.ranged)
    expect(getWeapons(op, 'fight')).toBe(op.melee)
  })

  it('getWeapon finds by id across ranged+melee', () => {
    const op = operatives[0]
    const allWeapons = [...op.ranged, ...op.melee]
    if (allWeapons.length > 0) {
      const w = allWeapons[0]
      expect(getWeapon(op, w.id)).toEqual(w)
    }
    expect(getWeapon(op, 'no-such-weapon')).toBeNull()
  })

  it('getProfile finds by weapon+profile id', () => {
    const op = operatives.find(o => o.ranged.length > 0) ?? operatives[0]
    const w = op.ranged[0] ?? op.melee[0]
    if (w) {
      const p = w.profiles[0]
      expect(getProfile(op, w.id, p.id)).toEqual(p)
      expect(getProfile(op, w.id, 'no-such-profile')).toBeNull()
      expect(getProfile(op, 'no-such-weapon', p.id)).toBeNull()
    }
  })

  it('toAttacker normalizes lethal string "5+" to true and strips id/name/brutal', () => {
    const op = operatives[0]
    const w = [...op.ranged, ...op.melee].find(we => we.profiles.some(pr => pr.lethal === '5+'))
    if (w) {
      const p = w.profiles.find(pr => pr.lethal === '5+')!
      const a = toAttacker(p)
      expect(a.lethal).toBe(true)
      expect((a as unknown as Record<string, unknown>).id).toBeUndefined()
      expect((a as unknown as Record<string, unknown>).name).toBeUndefined()
    }
    // boolean lethal passes through
    const boolProfile = [...op.ranged, ...op.melee].flatMap(we => we.profiles).find(pr => typeof pr.lethal === 'boolean')
    if (boolProfile) {
      const a2 = toAttacker(boolProfile)
      expect(typeof a2.lethal).toBe('boolean')
    }
  })

  it('toDefender returns defender object', () => {
    const op = operatives[0]
    expect(toDefender(op)).toEqual(op.defender)
  })
})
