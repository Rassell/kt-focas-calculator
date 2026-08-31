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
    <button
      type="button"
      onClick={onSelect}
      className={`flex flex-col items-center gap-2 p-5 px-4 border-2 rounded-xl bg-white cursor-pointer transition-all text-center ${selected ? 'border-[#6366f1] bg-[#eef2ff] shadow-[0_2px_12px_rgba(99,102,241,0.2)]' : 'border-[#e2e6f0] hover:border-[#c7d2fe] hover:bg-[#f8f9ff]'}`}
    >
      <span className="text-[32px] leading-none">{isShoot ? '🎯' : '⚔️'}</span>
      <span className="text-base font-bold text-[#0f172a]">{isShoot ? 'Shoot' : 'Fight'}</span>
      <span className="text-xs text-[#64748b]">{isShoot ? 'Ranged attack — use BS, cover & obscured' : 'Melee attack — use WS, close combat'}</span>
    </button>
  )
}

export function OperativeCard({ op, mode, selected, onSelect, variant }: { op: OperativePreset, mode: Mode, selected: boolean, onSelect: () => void, variant: 'attacker' | 'defender' }) {
  const att = toAttacker(op, mode)
  const def = toDefender(op)
  const pill = 'bg-[#f1f5f9] px-1.5 py-0.5 rounded-full border border-[#e2e6f0] text-[#334155]'
  const tagPill = 'bg-[#eef2ff] border-[#c7d2fe] text-[#4338ca] px-1.5 py-0.5 rounded-full border text-[#334155]'
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex flex-col gap-1.5 p-3 border rounded-[10px] bg-white cursor-pointer text-left transition-all ${selected ? 'border-[#6366f1] bg-[#eef2ff] shadow-[0_2px_8px_rgba(99,102,241,0.18)]' : 'border-[#e2e6f0] hover:border-[#c7d2fe] hover:bg-[#f8f9ff]'}`}
    >
      <div className="flex justify-between items-baseline gap-2">
        <span className="text-[13px] font-bold text-[#0f172a]">{op.name}</span>
        <span className="text-[11px] text-[#64748b] whitespace-nowrap">{op.faction}</span>
      </div>
      <span className="text-[11px] text-[#6366f1] font-semibold">{op.role}</span>
      {variant === 'attacker' ? (
        <div className="flex flex-wrap gap-1.5 text-[11px]">
          <span className={pill}>{att.attacks}A</span>
          <span className={pill}>{att.bs}+</span>
          <span className={pill}>{att.normalDmg}/{att.critDmg} dmg</span>
          {att.piercing > 0 && <span className={pill}>Piercing {att.piercing}</span>}
          {att.lethal && <span className={pill}>Lethal 5+</span>}
          {att.rending && <span className={pill}>Rending</span>}
          {att.severe && <span className={pill}>Severe</span>}
          {att.reroll !== 'none' && <span className={tagPill}>{att.reroll}</span>}
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5 text-[11px]">
          <span className={pill}>{def.save}+ save</span>
          <span className={pill}>{def.wounds}W</span>
          {def.coverSaves > 0 && <span className={pill}>Cover {def.coverSaves}</span>}
          {def.indomitus && <span className={pill}>Indomitus</span>}
          {def.obscured && <span className={pill}>Obscured</span>}
        </div>
      )}
    </button>
  )
}
