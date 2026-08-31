import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useFilteredOperatives } from './useFilteredOperatives'
import { operatives, getOperativeFaction } from '../data/operatives'

describe('useFilteredOperatives', () => {
  it('empty query returns all (or mode-filtered) operatives', () => {
    const { result } = renderHook(() => useFilteredOperatives('', null))
    expect(result.current.length).toBe(operatives.length)

    const { result: r2 } = renderHook(() => useFilteredOperatives('   ', null))
    expect(r2.current.length).toBe(operatives.length)
  })

  it('filters by operative name case-insensitive', () => {
    const first = operatives[0]
    const q = first.name.slice(0, 3).toLowerCase()
    const { result } = renderHook(() => useFilteredOperatives(q, null))
    expect(result.current.some(o => o.id === first.id)).toBe(true)
    // uppercase should also match
    const { result: r2 } = renderHook(() => useFilteredOperatives(q.toUpperCase(), null))
    expect(r2.current.some(o => o.id === first.id)).toBe(true)
  })

  it('filters by faction', () => {
    const first = operatives[0]
    const faction = getOperativeFaction(first.id)
    if (faction) {
      const { result } = renderHook(() => useFilteredOperatives(faction.toLowerCase(), null))
      expect(result.current.some(o => o.id === first.id)).toBe(true)
    }
  })

  it('filters by weapon/profile name', () => {
    const op = operatives.find(o => o.ranged.length > 0)!
    const weaponName = op.ranged[0].name.toLowerCase()
    const { result } = renderHook(() => useFilteredOperatives(weaponName, null))
    expect(result.current.some(o => o.id === op.id)).toBe(true)
  })

  it('no match returns empty', () => {
    const { result } = renderHook(() => useFilteredOperatives('__no_such_operative_xyz__', null))
    expect(result.current.length).toBe(0)
  })

  it('mode filters operatives with no weapons for that mode', () => {
    const { result: shoot } = renderHook(() => useFilteredOperatives('', 'shoot'))
    for (const op of shoot.current) expect(op.ranged.length).toBeGreaterThan(0)

    const { result: fight } = renderHook(() => useFilteredOperatives('', 'fight'))
    for (const op of fight.current) expect(op.melee.length).toBeGreaterThan(0)
  })

  it('trims whitespace', () => {
    const first = operatives[0]
    const q = `  ${first.name.slice(0, 3)}  `
    const { result } = renderHook(() => useFilteredOperatives(q, null))
    expect(result.current.some(o => o.id === first.id)).toBe(true)
  })
})
