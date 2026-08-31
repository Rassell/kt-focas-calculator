import { getOperativeFaction, getWeapons, toAttacker, toDefender } from '../../data/operatives'
import type { Mode, Operative } from '../../types/operative'
import { Pill } from '../ui/Pill'

export function OperativeCard({ op, mode, selected, onSelect, variant }: { op: Operative; mode: Mode; selected: boolean; onSelect: () => void; variant: 'attacker' | 'defender' }) {
  const def = toDefender(op)
  const faction = getOperativeFaction(op.id)
  const weapons = getWeapons(op, mode)
  const previewProfile = weapons[0]?.profiles[0] ?? null
  const previewAtt = previewProfile ? toAttacker(previewProfile) : null
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex flex-col gap-1.5 p-3 border rounded-[10px] bg-white cursor-pointer text-left transition-all ${selected ? 'border-[#6366f1] bg-[#eef2ff] shadow-[0_2px_8px_rgba(99,102,241,0.18)]' : 'border-[#e2e6f0] hover:border-[#c7d2fe] hover:bg-[#f8f9ff]'}`}
    >
      <div className="flex justify-between items-baseline gap-2">
        <span className="text-[13px] font-bold text-[#0f172a]">{op.name}</span>
        <span className="text-[11px] text-[#64748b] whitespace-nowrap">{faction}</span>
      </div>
      {variant === 'attacker' ? (
        <>
          <span className="text-[11px] text-[#6366f1] font-semibold">
            {weapons.length === 0 ? 'No weapons' : `${weapons.length} weapon${weapons.length > 1 ? 's' : ''} · ${weapons.map(w => w.name).join(', ')}`}
          </span>
          {previewAtt ? (
            <div className="flex flex-wrap gap-1.5">
              <Pill>{previewAtt.attacks}A</Pill>
              <Pill>{previewAtt.bs}+</Pill>
              <Pill>{previewAtt.normalDmg}/{previewAtt.critDmg} dmg</Pill>
              {previewAtt.piercing > 0 && <Pill>Piercing {previewAtt.piercing}</Pill>}
              {previewAtt.lethal && <Pill>Lethal 5+</Pill>}
              {previewAtt.rending && <Pill>Rending</Pill>}
              {previewAtt.severe && <Pill>Severe</Pill>}
              {previewAtt.punishing && <Pill>Punishing</Pill>}
              {previewAtt.brutal && <Pill>Brutal</Pill>}
              {previewAtt.reroll !== 'none' && <Pill variant="tag">{previewAtt.reroll}</Pill>}
            </div>
          ) : (
            <span className="text-[11px] text-[#94a3b8]">No {mode === 'shoot' ? 'ranged' : 'melee'} profile</span>
          )}
        </>
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
