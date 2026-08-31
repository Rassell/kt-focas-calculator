import { useNavigate } from 'react-router-dom'
import { ModeCard } from '../../components/wizard/ModeCard'
import { StepContainer } from '../../components/wizard/StepContainer'
import { Hint, PrimaryButton, WizardNavigation } from '../../components/wizard/WizardNavigation'
import { useWizardParams } from '../../hooks/useWizardParams'

export default function ModeStep() {
  const { mode, updateParams, buildSearch } = useWizardParams()
  const navigate = useNavigate()

  return (
    <StepContainer title="">
      <div className="grid grid-cols-2 gap-3 max-[640px]:grid-cols-1">
        <ModeCard mode="shoot" selected={mode === 'shoot'} onSelect={() => updateParams({ mode: 'shoot' })} />
        <ModeCard mode="fight" selected={mode === 'fight'} onSelect={() => updateParams({ mode: 'fight' })} />
      </div>
      <WizardNavigation>
        <Hint>{mode ? `Selected: ${mode === 'shoot' ? 'Shoot (BS)' : 'Fight (WS)'}` : 'Select one to continue'}</Hint>
        <PrimaryButton disabled={!mode} onClick={() => navigate(`/wizard/attacker${buildSearch({})}`)}>Next →</PrimaryButton>
      </WizardNavigation>
    </StepContainer>
  )
}
