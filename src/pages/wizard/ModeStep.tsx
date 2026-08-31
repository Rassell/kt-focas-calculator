import { useNavigate } from 'react-router-dom'
import { ModeCard, useWizardParams } from './shared'

export default function ModeStep() {
  const { mode, updateParams, buildSearch } = useWizardParams()
  const navigate = useNavigate()

  return (
    <div className="wizard-step">
      <h3 className="wizard-title">Choose attack type</h3>
      <p className="wizard-subtitle">Will this be a shooting or fight attack? This affects which weapon profile is used.</p>
      <div className="wizard-mode-grid">
        <ModeCard mode="shoot" selected={mode === 'shoot'} onSelect={() => updateParams({ mode: 'shoot' })} />
        <ModeCard mode="fight" selected={mode === 'fight'} onSelect={() => updateParams({ mode: 'fight' })} />
      </div>
      <div className="wizard-actions">
        <span className="wizard-hint">{mode ? `Selected: ${mode === 'shoot' ? 'Shoot (BS)' : 'Fight (WS)'}` : 'Select one to continue'}</span>
        <button className="wizard-btn primary" disabled={!mode} onClick={() => navigate(`/wizard/attacker${buildSearch({})}`)}>Next →</button>
      </div>
    </div>
  )
}
