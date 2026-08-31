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
    <div className="wizard">
      <div className="page-intro">
        <h2>Wizard</h2>
        <p>Step through a guided calculation — pick shoot or fight, then choose your operative and target.</p>
      </div>

      <nav className="wizard-progress" aria-label="Wizard steps">
        {steps.map((s, idx) =>
          s.enabled ? (
            <NavLink
              key={s.label}
              to={s.to}
              className={({ isActive }) => `wizard-step-dot clickable ${isActive ? 'active' : ''}`}
            >
              <span className="wizard-step-num">{idx + 1}</span>
              <span className="wizard-step-label">{s.label}</span>
            </NavLink>
          ) : (
            <span key={s.label} className="wizard-step-dot disabled" aria-disabled="true">
              <span className="wizard-step-num">{idx + 1}</span>
              <span className="wizard-step-label">{s.label}</span>
            </span>
          )
        )}
      </nav>

      <div className="wizard-panel">
        <Outlet />
      </div>
    </div>
  )
}
