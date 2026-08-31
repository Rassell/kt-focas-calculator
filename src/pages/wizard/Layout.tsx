import { NavLink, Outlet, useSearchParams } from 'react-router-dom'

export default function WizardLayout() {
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

  return (
    <div className="flex flex-col gap-4">
      <div className="mb-3.5">
        <h2 className="m-0 mb-1 text-[18px] text-[#0f172a] font-semibold">Wizard</h2>
        <p className="m-0 text-[13px] text-[#64748b]">Step through a guided calculation — pick shoot or fight, then choose your operative and target.</p>
      </div>

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
              <span className={`w-5 h-5 rounded-full grid place-items-center font-bold text-[11px] ${'bg-[#6366f1] text-white'}`}>{idx + 1}</span>
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

      <div className="bg-white border border-[#e2e6f0] rounded-xl overflow-hidden">
        <Outlet />
      </div>
    </div>
  )
}
