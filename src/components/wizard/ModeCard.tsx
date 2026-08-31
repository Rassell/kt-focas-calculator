import type { Mode } from '../../types/operative'

export function ModeCard({ mode, selected, onSelect }: { mode: Mode; selected: boolean; onSelect: () => void }) {
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
