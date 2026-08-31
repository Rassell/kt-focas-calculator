import { useState } from 'react'
import { NavLink, Navigate, Route, Routes, useSearchParams } from 'react-router-dom'
import WizardLayout from './pages/wizard/Layout'
import ModeStep from './pages/wizard/ModeStep'
import AttackerStep from './pages/wizard/AttackerStep'
import DefenderStep from './pages/wizard/DefenderStep'
import StatsStep from './pages/wizard/StatsStep'

function WizardStepsNav() {
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
          <span key={s.label} className={disabledLink} aria-disabled="true">
            {s.label}
          </span>
        )
      )}
    </div>
  )
}

export default function App() {
  const [showHelp, setShowHelp] = useState(false)

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)]">
      <header className="bg-[#0f1117] text-[#e8e8ef] border-b border-[#2a2d3a]">
        <div className="max-w-[1280px] mx-auto px-5 py-3.5 flex justify-between items-center gap-4 flex-wrap">
          <div className="flex gap-3 items-center">
            <span className="text-[28px] leading-none">⚔️</span>
            <div>
              <h1 className="m-0 text-[20px] text-white tracking-[-0.5px] font-semibold">KT FOCAS Calculator</h1>
              <p className="mt-0.5 text-xs text-[#9aa0b5]">Kill Team 2026 Calculator — work out the odds</p>
            </div>
          </div>
          <nav className="flex gap-3 items-center">
            <WizardStepsNav />
            <span className="text-[#3a3d4a]" aria-hidden>·</span>
            <button className="bg-[#1e2230] text-[#cbd5e1] border border-[#2a2d3a] px-2.5 py-1.5 rounded-md cursor-pointer text-[13px] hover:bg-[#252a3d] transition-colors" onClick={() => setShowHelp(v => !v)}>{showHelp ? 'Hide Help' : 'Help'}</button>
          </nav>
        </div>
      </header>

      {showHelp && (
        <div className="max-w-[1280px] mx-auto px-5 py-4 bg-[#f8f9ff] border-b border-[#e2e6f0] text-[13px] text-[#334155] w-full box-border">
          <h3 className="m-0 mb-2 text-sm font-semibold text-[#0f172a]">How it works</h3>
          <p>Set your ballistic skill / weapon skill, attacks, weapon rules, and cover, then read the chance of damage and kills. Starred items have hovertext. Geared ⚙️ items are advanced — tick Advanced to show them.</p>
          <ul className="mt-2 pl-[18px] list-disc space-y-1">
            <li><strong>Balanced</strong> rerolls 1 die. <strong>Relentless</strong> rerolls fails. <strong>Ceaseless</strong> rerolls 1s.</li>
            <li><strong>Rending:</strong> if ≥1 crit, retain a normal as crit. <strong>Severe:</strong> if no crits, change a normal to crit.</li>
            <li><strong>Obscured:</strong> attacker crits are retained as normals.</li>
            <li><strong>Cover Saves:</strong> auto-retained saves. <strong>JaS:</strong> Just a Scratch — ignore one hit.</li>
            <li><strong>Devastating:</strong> MW per crit (unsavable). <strong>Piercing:</strong> worsens save by AP.</li>
          </ul>
        </div>
      )}

      <main className="max-w-[1280px] mx-auto px-5 py-[18px] flex-1 w-full box-border">
        <Routes>
          <Route path="/" element={<Navigate to="/wizard/mode" replace />} />
          <Route path="/wizard" element={<WizardLayout />}>
            <Route index element={<Navigate to="mode" replace />} />
            <Route path="mode" element={<ModeStep />} />
            <Route path="attacker" element={<AttackerStep />} />
            <Route path="defender" element={<DefenderStep />} />
            <Route path="stats" element={<StatsStep />} />
          </Route>
          <Route path="*" element={<Navigate to="/wizard/mode" replace />} />
        </Routes>
      </main>

      <footer className="text-center px-5 py-3.5 text-xs text-[#64748b] border-t border-[#e2e6f0] bg-[#f8fafc]">
        <span>KT FOCAS Calculator — Kill Team 2026 Edition • <a href="https://ktcalc.com" target="_blank" rel="noreferrer" className="text-[#6366f1] no-underline hover:underline">Inspired by ktcalc.com</a> • <a href="https://github.com/Rassell/kt-focas-calculator" target="_blank" rel="noreferrer" className="text-[#6366f1] no-underline hover:underline">Open source</a> • <a href="https://assets.warhammer-community.com/killteam_keydownloads_literules_eng-jfhe9v0j7c-n0x6ozmgo9.pdf" target="_blank" rel="noreferrer" className="text-[#6366f1] no-underline hover:underline">Lite Rules PDF</a></span>
      </footer>
    </div>
  )
}
