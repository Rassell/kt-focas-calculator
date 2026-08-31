import { NavLink, useSearchParams } from 'react-router-dom'

type Variant = 'header' | 'progress'

export function WizardSteps({ variant = 'progress' }: { variant?: Variant }) {
  const [searchParams] = useSearchParams()
  const mode = searchParams.get('mode')
  const attacker = searchParams.get('attacker')
  const defender = searchParams.get('defender')
  const qs = searchParams.toString()
  const suffix = qs ? `?${qs}` : ''

  const steps = [
    { to: `/wizard/mode${suffix}`, label: 'Mode', enabled: true },
    { to: `/wizard/attacker${suffix}`, label: 'Attacker', enabled: !!mode },
    { to: `/wizard/defender${suffix}`, label: 'Defender', enabled: !!mode && !!attacker },
    { to: `/wizard/stats${suffix}`, label: 'Stats', enabled: !!mode && !!attacker && !!defender },
  ] as const

  if (variant === 'header') {
    const baseLink = 'text-[13px] px-2.5 py-1.5 rounded-md border border-transparent no-underline'
    const enabledLink = 'text-[#9aa0b5] hover:text-white hover:bg-[#1e2230] hover:border-[#2a2d3a]'
    const activeLink = 'text-white bg-[#252a3d] border-[#3b3f5a] font-semibold'
    const disabledLink = 'text-[#9aa0b5] opacity-40 pointer-events-none cursor-not-allowed text-[13px] px-2.5 py-1.5 rounded-md border border-transparent'
    return (
      <div className="flex gap-1.5 items-center">
        {steps.map(s =>
          s.enabled ? (
            <NavLink key={s.label} to={s.to} className={({ isActive }) => `${baseLink} ${isActive ? activeLink : enabledLink}`}>
              {s.label}
            </NavLink>
          ) : (
            <span key={s.label} className={disabledLink} aria-disabled="true">{s.label}</span>
          )
        )}
      </div>
    )
  }

  return (
    <nav className="flex gap-2 items-center justify-center flex-wrap" aria-label="Wizard steps">
      {steps.map((s, idx) =>
        s.enabled ? (
          <NavLink
            key={s.label}
            to={s.to}
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-medium transition-colors cursor-pointer ${isActive ? 'bg-[#0f1117] text-white border-[#0f1117]' : 'bg-white text-[#64748b] border-[#e2e6f0] hover:border-[#6366f1] hover:bg-[#f8f9ff]'}`
            }
          >
            <span className="w-5 h-5 rounded-full grid place-items-center font-bold text-[11px] bg-[#6366f1] text-white">{idx + 1}</span>
            <span className="font-semibold">{s.label}</span>
          </NavLink>
        ) : (
          <span key={s.label} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-[#e2e6f0] bg-white text-[#64748b] text-xs opacity-45 cursor-not-allowed" aria-disabled="true">
            <span className="w-5 h-5 rounded-full grid place-items-center bg-[#f1f5f9] text-[#334155] font-bold text-[11px]">{idx + 1}</span>
            <span className="font-semibold">{s.label}</span>
          </span>
        )
      )}
    </nav>
  )
}
