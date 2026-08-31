import type { Mode } from '../../types/operative'

import cuchillo from '../../assets/cuchillo.png'
import pistola from '../../assets/pistola.png'


export function ModeCard({ mode, selected, onSelect }: { mode: Mode; selected: boolean; onSelect: () => void }) {
  const isShoot = mode === 'shoot'
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex flex-col items-center gap-2 p-5 px-4 border-2 rounded-xl bg-white cursor-pointer transition-all text-center ${selected ? 'border-[#6366f1] bg-[#eef2ff] shadow-[0_2px_12px_rgba(99,102,241,0.2)]' : 'border-[#e2e6f0] hover:border-[#c7d2fe] hover:bg-[#f8f9ff]'}`}
    >
      <img
        src={isShoot ? pistola : cuchillo}
        alt={isShoot ? 'Pistol' : 'Knife'}
        className="h-32 w-32"
      />
      <span className="text-base font-bold text-[#0f172a]">{isShoot ? 'Shoot' : 'Fight'}</span>
    </button>
  )
}
