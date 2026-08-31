/* eslint-disable react-refresh/only-export-components */
import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Attacker, Defender } from '../../engine/calculator'
import operativesData from '../../data/operatives.json'

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

export const operatives = operativesData as OperativePreset[]

export function toAttacker(op: OperativePreset, mode: Mode): Attacker {
  return mode === 'shoot' ? op.shoot : op.fight
}

export function toDefender(op: OperativePreset): Defender {
  return op.defender
}

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

export function ModeCard({ mode, selected, onSelect }: { mode: Mode, selected: boolean, onSelect: () => void }) {
  const isShoot = mode === 'shoot'
  return (
    <button className={`wizard-mode-card ${selected ? 'selected' : ''}`} onClick={onSelect} type="button">
      <span className="wizard-mode-icon">{isShoot ? '🎯' : '⚔️'}</span>
      <span className="wizard-mode-title">{isShoot ? 'Shoot' : 'Fight'}</span>
      <span className="wizard-mode-desc">{isShoot ? 'Ranged attack — use BS, cover & obscured' : 'Melee attack — use WS, close combat'}</span>
    </button>
  )
}

export function OperativeCard({ op, mode, selected, onSelect, variant }: { op: OperativePreset, mode: Mode, selected: boolean, onSelect: () => void, variant: 'attacker' | 'defender' }) {
  const att = toAttacker(op, mode)
  const def = toDefender(op)
  return (
    <button className={`wizard-op-card ${selected ? 'selected' : ''}`} onClick={onSelect} type="button">
      <div className="wizard-op-head">
        <span className="wizard-op-name">{op.name}</span>
        <span className="wizard-op-faction">{op.faction}</span>
      </div>
      <span className="wizard-op-role">{op.role}</span>
      {variant === 'attacker' ? (
        <div className="wizard-op-stats">
          <span>{att.attacks}A</span>
          <span>{att.bs}+</span>
          <span>{att.normalDmg}/{att.critDmg} dmg</span>
          {att.piercing > 0 && <span>Piercing {att.piercing}</span>}
          {att.lethal && <span>Lethal 5+</span>}
          {att.rending && <span>Rending</span>}
          {att.severe && <span>Severe</span>}
          {att.reroll !== 'none' && <span className="wizard-tag">{att.reroll}</span>}
        </div>
      ) : (
        <div className="wizard-op-stats">
          <span>{def.save}+ save</span>
          <span>{def.wounds}W</span>
          {def.coverSaves > 0 && <span>Cover {def.coverSaves}</span>}
          {def.indomitus && <span>Indomitus</span>}
          {def.obscured && <span>Obscured</span>}
        </div>
      )}
    </button>
  )
}
