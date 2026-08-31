import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { createElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { parseMode, useWizardParams } from './useWizardParams'
import { operatives } from '../data/operatives'

function wrapper(initialEntries: string[]) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(MemoryRouter, { initialEntries }, children)
  }
}

describe('parseMode', () => {
  it('returns shoot/fight or null', () => {
    expect(parseMode('shoot')).toBe('shoot')
    expect(parseMode('fight')).toBe('fight')
    expect(parseMode(null)).toBeNull()
    expect(parseMode('')).toBeNull()
    expect(parseMode('invalid')).toBeNull()
    expect(parseMode('Shoot')).toBeNull()
  })
})

describe('useWizardParams', () => {
  it('reads mode/attacker/defender from URL', () => {
    const firstOp = operatives[0]
    const { result } = renderHook(() => useWizardParams(), {
      wrapper: wrapper([`/wizard?mode=shoot&attacker=${firstOp.id}&defender=${firstOp.id}`]),
    })
    expect(result.current.mode).toBe('shoot')
    expect(result.current.attackerId).toBe(firstOp.id)
    expect(result.current.defenderId).toBe(firstOp.id)
    expect(result.current.attackerOp?.id).toBe(firstOp.id)
    expect(result.current.defenderOp?.id).toBe(firstOp.id)
  })

  it('returns null for missing params', () => {
    const { result } = renderHook(() => useWizardParams(), {
      wrapper: wrapper(['/wizard']),
    })
    expect(result.current.mode).toBeNull()
    expect(result.current.attackerId).toBeNull()
    expect(result.current.defenderId).toBeNull()
    expect(result.current.attackerOp).toBeNull()
    expect(result.current.defenderOp).toBeNull()
  })

  it('reads weapon/profile and hasAttackerProfile', () => {
    const op = operatives.find(o => o.ranged.length > 0)!
    const w = op.ranged[0]
    const p = w.profiles[0]
    const { result } = renderHook(() => useWizardParams(), {
      wrapper: wrapper([`/wizard?attacker=${op.id}&weapon=${w.id}&profile=${p.id}`]),
    })
    expect(result.current.attackerWeapon?.id).toBe(w.id)
    expect(result.current.attackerProfile?.id).toBe(p.id)
    expect(result.current.hasAttackerProfile).toBe(true)
  })

  it('hasAttackerProfile false when profile missing', () => {
    const op = operatives[0]
    const { result } = renderHook(() => useWizardParams(), {
      wrapper: wrapper([`/wizard?attacker=${op.id}`]),
    })
    expect(result.current.hasAttackerProfile).toBe(false)
    expect(result.current.attackerWeapon).toBeNull()
    expect(result.current.attackerProfile).toBeNull()
  })

  it('buildSearch merges patch and handles cascading clears', () => {
    const op = operatives[0]
    const w = op.ranged[0] ?? op.melee[0]
    const p = w?.profiles[0]
    const initial = `/wizard?mode=shoot&attacker=${op.id}&weapon=${w.id}&profile=${p.id}`
    const { result } = renderHook(() => useWizardParams(), {
      wrapper: wrapper([initial]),
    })
    // changing attacker without explicit weapon/profile should clear them
    const otherOp = operatives.find(o => o.id !== op.id) ?? op
    const search = result.current.buildSearch({ attacker: otherOp.id })
    expect(search).not.toContain('weapon=')
    expect(search).not.toContain('profile=')
    expect(search).toContain(`attacker=${otherOp.id}`)

    // changing weapon without profile should clear profile
    const otherWeapon = op.ranged.find(we => we.id !== w.id) ?? op.melee[0]
    if (otherWeapon && otherWeapon.id !== w.id) {
      const search2 = result.current.buildSearch({ weapon: otherWeapon.id })
      expect(search2).not.toContain('profile=')
    }

    // null/empty deletes key
    const search3 = result.current.buildSearch({ mode: null })
    expect(search3).not.toContain('mode=')
  })

  it('updateParams updates URL and cascades clears', () => {
    const op = operatives[0]
    const w = op.ranged[0] ?? op.melee[0]
    const p = w?.profiles[0]
    const { result } = renderHook(() => useWizardParams(), {
      wrapper: wrapper([`/wizard?mode=shoot&attacker=${op.id}&weapon=${w.id}&profile=${p.id}`]),
    })
    const otherOp = operatives.find(o => o.id !== op.id) ?? op
    act(() => {
      result.current.updateParams({ attacker: otherOp.id })
    })
    expect(result.current.attackerId).toBe(otherOp.id)
    expect(result.current.attackerWeaponId).toBeNull()
    expect(result.current.attackerProfileId).toBeNull()
  })

  it('updateParams deletes key on null/empty', () => {
    const { result } = renderHook(() => useWizardParams(), {
      wrapper: wrapper(['/wizard?mode=shoot']),
    })
    act(() => {
      result.current.updateParams({ mode: null })
    })
    expect(result.current.mode).toBeNull()
  })
})
