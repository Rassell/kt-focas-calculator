import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { operatives } from '../data/operatives'
import type { Mode } from '../types/operative'

export function parseMode(v: string | null): Mode | null {
  if (v === 'shoot' || v === 'fight') return v
  return null
}

export function useWizardParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  const mode = parseMode(searchParams.get('mode'))
  const attackerId = searchParams.get('attacker')
  const defenderId = searchParams.get('defender')

  const attackerOp = useMemo(() => operatives.find(o => o.id === attackerId) ?? null, [attackerId])
  const defenderOp = useMemo(() => operatives.find(o => o.id === defenderId) ?? null, [defenderId])

  function updateParams(patch: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams)
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '') next.delete(k)
      else next.set(k, v)
    }
    setSearchParams(next)
  }

  function buildSearch(patch: Record<string, string | null>): string {
    const next = new URLSearchParams(searchParams)
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '') next.delete(k)
      else next.set(k, v)
    }
    const s = next.toString()
    return s ? `?${s}` : ''
  }

  return { searchParams, setSearchParams, mode, attackerId, defenderId, attackerOp, defenderOp, updateParams, buildSearch }
}
