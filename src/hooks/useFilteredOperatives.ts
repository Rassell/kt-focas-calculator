import { useMemo } from 'react'
import { operatives } from '../data/operatives'
import type { OperativePreset } from '../types/operative'

export function useFilteredOperatives(query: string): OperativePreset[] {
  return useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return operatives
    return operatives.filter(o => o.name.toLowerCase().includes(q) || o.faction.toLowerCase().includes(q) || o.role.toLowerCase().includes(q))
  }, [query])
}
