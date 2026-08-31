import { getWeapons, toAttacker } from '../../data/operatives'
import type { Mode, Operative } from '../../types/operative'
import { Pill } from '../ui/Pill'

export function WeaponProfilePicker({
  operative,
  mode,
  selectedWeaponId,
  selectedProfileId,
  onSelectWeapon,
  onSelectProfile,
}: {
  operative: Operative
  mode: Mode
  selectedWeaponId: string | null
  selectedProfileId: string | null
  onSelectWeapon: (weaponId: string) => void
  onSelectProfile: (weaponId: string, profileId: string) => void
}) {
  const weapons = getWeapons(operative, mode)

  if (weapons.length === 0) {
    return <div className="p-3 text-[13px] text-[#64748b] border border-dashed border-[#cbd5e1] rounded-lg bg-[#f8fafc]">No {mode === 'shoot' ? 'ranged' : 'melee'} weapons for {operative.name}.</div>
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <div className="text-[11px] font-bold tracking-[0.06em] uppercase text-[#64748b] mb-1.5">Weapon</div>
        <div className="flex flex-wrap gap-2">
          {weapons.map(w => (
            <button
              key={w.id}
              type="button"
              onClick={() => onSelectWeapon(w.id)}
              className={`px-3 py-2 rounded-lg border text-[13px] font-semibold text-left transition-colors ${selectedWeaponId === w.id ? 'border-[#6366f1] bg-[#eef2ff] text-[#4338ca]' : 'border-[#e2e6f0] bg-white text-[#0f172a] hover:border-[#c7d2fe] hover:bg-[#f8f9ff]'}`}
            >
              {w.name}
              <span className="ml-2 text-[11px] font-normal text-[#64748b]">{w.profiles.length} profile{w.profiles.length > 1 ? 's' : ''}</span>
            </button>
          ))}
        </div>
      </div>

      {selectedWeaponId && (() => {
        const weapon = weapons.find(w => w.id === selectedWeaponId)
        if (!weapon) return null
        return (
          <div>
            <div className="text-[11px] font-bold tracking-[0.06em] uppercase text-[#64748b] mb-1.5">Profile — {weapon.name}</div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-2">
              {weapon.profiles.map(p => {
                const att = toAttacker(p)
                const selected = selectedProfileId === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onSelectProfile(weapon.id, p.id)}
                    className={`flex flex-col gap-1.5 p-3 border rounded-[10px] bg-white text-left transition-all ${selected ? 'border-[#6366f1] bg-[#eef2ff] shadow-[0_2px_8px_rgba(99,102,241,0.18)]' : 'border-[#e2e6f0] hover:border-[#c7d2fe] hover:bg-[#f8f9ff]'}`}
                  >
                    <span className="text-[13px] font-bold text-[#0f172a]">{p.name}</span>
                    <div className="flex flex-wrap gap-1.5">
                      <Pill>{att.attacks}A</Pill>
                      <Pill>{att.bs}+</Pill>
                      <Pill>{att.normalDmg}/{att.critDmg} dmg</Pill>
                      {att.piercing > 0 && <Pill>Piercing {att.piercing}</Pill>}
                      {att.piercingCrits > 0 && <Pill>Piercing Crits {att.piercingCrits}</Pill>}
                      {att.devastating > 0 && <Pill>Devastating {att.devastating}</Pill>}
                      {att.lethal && <Pill>Lethal 5+</Pill>}
                      {att.rending && <Pill>Rending</Pill>}
                      {att.severe && <Pill>Severe</Pill>}
                      {att.punishing && <Pill>Punishing</Pill>}
                      {att.accurate > 0 && <Pill>Accurate {att.accurate}</Pill>}
                      {att.brutal && <Pill>Brutal</Pill>}
                      {att.reroll !== 'none' && <Pill variant="tag">{att.reroll}</Pill>}
                      {att.rounds > 1 && <Pill>{att.rounds} rounds</Pill>}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
