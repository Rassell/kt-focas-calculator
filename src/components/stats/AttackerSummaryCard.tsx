import { getOperativeFaction, toAttacker } from '../../data/operatives'
import type { Mode, Operative, Profile, Weapon } from '../../types/operative'
import { Pill } from '../ui/Pill'

export function AttackerSummaryCard({ operative, weapon, profile, mode }: { operative: Operative; weapon: Weapon; profile: Profile; mode: Mode }) {
  const a = toAttacker(profile)
  const faction = getOperativeFaction(operative.id)
  return (
    <div className="bg-[#f8fafc] border border-[#e2e6f0] rounded-[10px] p-3">
      <div className="text-[11px] font-bold tracking-[0.06em] uppercase text-[#64748b] mb-1">{mode === 'shoot' ? 'Shooter' : 'Fighter'}</div>
      <div className="text-sm font-bold text-[#0f172a]">{operative.name}</div>
      <div className="text-xs text-[#64748b] mb-1">{faction} · {weapon.name} · {profile.name}</div>
      <div className="flex flex-wrap gap-1.5 text-[11px]">
        <Pill variant="white">{a.attacks} Attacks</Pill>
        <Pill variant="white">{a.bs}+ {mode === 'shoot' ? 'BS' : 'WS'}</Pill>
        <Pill variant="white">{a.normalDmg}/{a.critDmg} dmg</Pill>
        {a.piercing > 0 && <Pill variant="white">Piercing {a.piercing}</Pill>}
        {a.piercingCrits > 0 && <Pill variant="white">Piercing Crits {a.piercingCrits}</Pill>}
        {a.devastating > 0 && <Pill variant="white">Devastating {a.devastating}</Pill>}
        {a.lethal && <Pill variant="white">Lethal 5+</Pill>}
        {a.rending && <Pill variant="white">Rending</Pill>}
        {a.severe && <Pill variant="white">Severe</Pill>}
        {a.punishing && <Pill variant="white">Punishing</Pill>}
        {a.accurate > 0 && <Pill variant="white">Accurate {a.accurate}</Pill>}
        {a.brutal && <Pill variant="white">Brutal</Pill>}
        {a.reroll !== 'none' && <Pill variant="white">{a.reroll}</Pill>}
        {a.rounds > 1 && <Pill variant="white">{a.rounds} rounds</Pill>}
      </div>
    </div>
  )
}
