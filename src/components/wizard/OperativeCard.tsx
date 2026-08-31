import { toAttacker, toDefender } from '../../data/operatives'
import type { Mode, OperativePreset } from '../../types/operative'
import { Pill } from '../ui/Pill'

export function OperativeCard({ op, mode, selected, onSelect, variant }: { op: OperativePreset; mode: Mode; selected: boolean; onSelect: () => void; variant: 'attacker' | 'defender' }) {
  const att = toAttacker(op, mode)
  const def = toDefender(op)
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
        <div className="flex flex-wrap gap-1.5">
          <Pill>{att.attacks}A</Pill>
          <Pill>{att.bs}+</Pill>
          <Pill>{att.normalDmg}/{att.critDmg} dmg</Pill>
          {att.piercing > 0 && <Pill>Piercing {att.piercing}</Pill>}
          {att.lethal && <Pill>Lethal 5+</Pill>}
          {att.rending && <Pill>Rending</Pill>}
          {att.severe && <Pill>Severe</Pill>}
          {att.reroll !== 'none' && <Pill variant="tag">{att.reroll}</Pill>}
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          <Pill>{def.save}+ save</Pill>
          <Pill>{def.wounds}W</Pill>
          {def.coverSaves > 0 && <Pill>Cover {def.coverSaves}</Pill>}
          {def.indomitus && <Pill>Indomitus</Pill>}
          {def.obscured && <Pill>Obscured</Pill>}
        </div>
      )}
    </button>
  )
}
