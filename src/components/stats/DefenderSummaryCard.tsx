import { getOperativeFaction, toDefender } from '../../data/operatives'
import type { Operative } from '../../types/operative'
import { Pill } from '../ui/Pill'

export function DefenderSummaryCard({ op, coverSaves, obscured }: { op: Operative; coverSaves: number; obscured: boolean }) {
  const d = toDefender(op)
  const faction = getOperativeFaction(op.id)
  return (
    <div className="bg-[#f8fafc] border border-[#e2e6f0] rounded-[10px] p-3">
      <div className="text-[11px] font-bold tracking-[0.06em] uppercase text-[#64748b] mb-1">Defender</div>
      <div className="text-sm font-bold text-[#0f172a]">{op.name}</div>
      <div className="text-xs text-[#64748b] mb-2">{faction}</div>
      <div className="flex flex-wrap gap-1.5 text-[11px]">
        <Pill variant="white">{d.save}+ Save</Pill>
        <Pill variant="white">{d.wounds} Wounds</Pill>
        {d.indomitus && <Pill variant="white">Indomitus</Pill>}
        {d.jasCrits && <Pill variant="white">JaS Crits</Pill>}
        {d.jasNormals && <Pill variant="white">JaS Normals</Pill>}
        {coverSaves > 0 && <Pill variant="white">Cover {coverSaves}</Pill>}
        {obscured && <Pill variant="white">Obscured</Pill>}
      </div>
    </div>
  )
}
