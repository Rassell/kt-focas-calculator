import { useMemo } from 'react'
import { getOperativeFaction, operatives } from '../data/operatives'
import type { Mode, Operative } from '../types/operative'

export function useFilteredOperatives(query: string, mode?: Mode | null): Operative[] {
  return useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = operatives
    // For attacker context, hide operatives with no weapons for that mode
    if (mode) {
      list = list.filter(op => (mode === 'shoot' ? op.ranged.length > 0 : op.melee.length > 0))
    }
    if (!q) return list
    return list.filter(op => {
      const faction = getOperativeFaction(op.id).toLowerCase()
      if (op.name.toLowerCase().includes(q) || faction.includes(q)) return true
      const weapons = [...op.ranged, ...op.melee]
      return weapons.some(w => w.name.toLowerCase().includes(q) || w.profiles.some(p => p.name.toLowerCase().includes(q)))
    })
  }, [query, mode])
}
