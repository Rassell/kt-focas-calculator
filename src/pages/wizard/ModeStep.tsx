import { useNavigate } from 'react-router-dom'
import { ModeCard, useWizardParams } from './shared'

export default function ModeStep() {
  const { mode, updateParams, buildSearch } = useWizardParams()
  const navigate = useNavigate()

  return (
    <div className="p-[18px]">
      <h3 className="m-0 mb-1.5 text-base text-[#0f172a] font-semibold">Choose attack type</h3>
      <p className="m-0 mb-3.5 text-[13px] text-[#64748b]">Will this be a shooting or fight attack? This affects which weapon profile is used.</p>
      <div className="grid grid-cols-2 gap-3 max-[640px]:grid-cols-1">
        <ModeCard mode="shoot" selected={mode === 'shoot'} onSelect={() => updateParams({ mode: 'shoot' })} />
        <ModeCard mode="fight" selected={mode === 'fight'} onSelect={() => updateParams({ mode: 'fight' })} />
      </div>
      <div className="flex gap-2.5 items-center justify-between mt-4 flex-wrap">
        <span className="text-xs text-[#64748b]">{mode ? `Selected: ${mode === 'shoot' ? 'Shoot (BS)' : 'Fight (WS)'}` : 'Select one to continue'}</span>
        <button className="px-3.5 py-2 rounded-lg border text-[13px] font-semibold cursor-pointer transition-colors disabled:opacity-45 disabled:cursor-not-allowed bg-[#6366f1] text-white border-[#6366f1] hover:bg-[#4f46e5] disabled:hover:bg-[#6366f1]" disabled={!mode} onClick={() => navigate(`/wizard/attacker${buildSearch({})}`)}>Next →</button>
      </div>
    </div>
  )
}
