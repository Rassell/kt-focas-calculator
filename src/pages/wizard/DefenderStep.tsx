import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { OperativeGrid } from '../../components/wizard/OperativeGrid'
import { useFilteredOperatives } from '../../hooks/useFilteredOperatives'
import { OperativeSearchInput } from '../../components/wizard/OperativeSearchInput'
import { StepContainer, StepGuard } from '../../components/wizard/StepContainer'
import { Hint, PrimaryButton, SecondaryButton, WizardNavigation } from '../../components/wizard/WizardNavigation'
import { findOperative } from '../../data/operatives'
import { useWizardParams } from '../../hooks/useWizardParams'

export default function DefenderStep() {
  const { mode, hasAttackerProfile, defenderId, updateParams, buildSearch } = useWizardParams()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const filtered = useFilteredOperatives(query)

  if (!mode) {
    return (
      <StepGuard message="Pick a mode first." action={<SecondaryButton onClick={() => navigate(`/wizard/mode${buildSearch({})}`)}>← Go to Mode</SecondaryButton>} />
    )
  }
  if (!hasAttackerProfile) {
    return (
      <StepGuard message="Pick an attacker weapon/profile first." action={<SecondaryButton onClick={() => navigate(`/wizard/attacker${buildSearch({})}`)}>← Go to Attacker</SecondaryButton>} />
    )
  }

  return (
    <StepContainer title="Select defender" description="Choose the target operative. Cover and obscured are situational checks set on the next step.">
      <OperativeSearchInput value={query} onChange={setQuery} />
      <OperativeGrid operatives={filtered} mode={mode} selectedId={defenderId} onSelect={id => updateParams({ defender: id })} variant="defender" query={query} />
      <WizardNavigation>
        <SecondaryButton onClick={() => navigate(`/wizard/attacker${buildSearch({})}`)}>← Back</SecondaryButton>
        <Hint>{defenderId ? `Selected: ${findOperative(defenderId)?.name ?? defenderId}` : 'Select a defender'}</Hint>
        <PrimaryButton disabled={!defenderId} onClick={() => navigate(`/wizard/stats${buildSearch({})}`)}>Show stats →</PrimaryButton>
      </WizardNavigation>
    </StepContainer>
  )
}
