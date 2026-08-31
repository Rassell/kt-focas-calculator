import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { findOperative, getProfile, getWeapon } from '../data/operatives'
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
  const attackerWeaponId = searchParams.get('weapon')
  const attackerProfileId = searchParams.get('profile')

  const attackerOp = useMemo(() => (attackerId ? findOperative(attackerId) : null), [attackerId])
  const defenderOp = useMemo(() => (defenderId ? findOperative(defenderId) : null), [defenderId])

  const attackerWeapon = useMemo(() => {
    if (!attackerOp || !attackerWeaponId) return null
    return getWeapon(attackerOp, attackerWeaponId)
  }, [attackerOp, attackerWeaponId])

  const attackerProfile = useMemo(() => {
    if (!attackerOp || !attackerWeaponId || !attackerProfileId) return null
    return getProfile(attackerOp, attackerWeaponId, attackerProfileId)
  }, [attackerOp, attackerWeaponId, attackerProfileId])

  const hasAttackerProfile = !!attackerProfile

  function updateParams(patch: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams)
    // Cascading clears: changing attacker clears weapon/profile; changing weapon clears profile
    if ('attacker' in patch) {
      const v = patch.attacker
      const changing = v !== attackerId
      if (changing) {
        if (!('weapon' in patch)) next.delete('weapon')
        if (!('profile' in patch)) next.delete('profile')
      }
    }
    if ('weapon' in patch) {
      const v = patch.weapon
      const changing = v !== attackerWeaponId
      if (changing && !('profile' in patch)) next.delete('profile')
    }
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '') next.delete(k)
      else next.set(k, v)
    }
    setSearchParams(next)
  }

  function buildSearch(patch: Record<string, string | null>): string {
    const next = new URLSearchParams(searchParams)
    if ('attacker' in patch && patch.attacker !== attackerId) {
      if (!('weapon' in patch)) next.delete('weapon')
      if (!('profile' in patch)) next.delete('profile')
    }
    if ('weapon' in patch && patch.weapon !== attackerWeaponId && !('profile' in patch)) {
      next.delete('profile')
    }
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '') next.delete(k)
      else next.set(k, v)
    }
    const s = next.toString()
    return s ? `?${s}` : ''
  }

  return {
    searchParams,
    setSearchParams,
    mode,
    attackerId,
    defenderId,
    attackerWeaponId,
    attackerProfileId,
    attackerOp,
    defenderOp,
    attackerWeapon,
    attackerProfile,
    hasAttackerProfile,
    updateParams,
    buildSearch,
  }
}
