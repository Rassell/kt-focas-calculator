import { useState } from 'react'
import { WizardSteps } from '../wizard/WizardSteps'
import { HelpPanel } from './HelpPanel'

export function AppHeader() {
  const [showHelp, setShowHelp] = useState(false)
  return (
    <>
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
            <WizardSteps variant="header" />
            <span className="text-[#3a3d4a]" aria-hidden>·</span>
            <button className="bg-[#1e2230] text-[#cbd5e1] border border-[#2a2d3a] px-2.5 py-1.5 rounded-md cursor-pointer text-[13px] hover:bg-[#252a3d] transition-colors" onClick={() => setShowHelp(v => !v)}>{showHelp ? 'Hide Help' : 'Help'}</button>
          </nav>
        </div>
      </header>
      {showHelp && <HelpPanel />}
    </>
  )
}
