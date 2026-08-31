import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { OperativeGrid } from '../../components/wizard/OperativeGrid'
import { useFilteredOperatives } from '../../hooks/useFilteredOperatives'
import { OperativeSearchInput } from '../../components/wizard/OperativeSearchInput'
import { StepContainer, StepGuard } from '../../components/wizard/StepContainer'
import { Hint, PrimaryButton, SecondaryButton, WizardNavigation } from '../../components/wizard/WizardNavigation'
import { operatives } from '../../data/operatives'
import { useWizardParams } from '../../hooks/useWizardParams'

export default function AttackerStep() {
  const { mode, attackerId, updateParams, buildSearch } = useWizardParams()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const filtered = useFilteredOperatives(query)

  if (!mode) {
    return (
      <StepGuard message="Pick a mode first." action={<SecondaryButton onClick={() => navigate(`/wizard/mode${buildSearch({})}`)}>← Go to Mode</SecondaryButton>} />
    )
  }

  return (
    <StepContainer title={`Select attacker — ${mode === 'shoot' ? 'Shooter' : 'Fighter'}`} description="Pick from predefined operatives. Stats are read from src/data/operatives.json.">
      <OperativeSearchInput value={query} onChange={setQuery} />
      <OperativeGrid operatives={filtered} mode={mode} selectedId={attackerId} onSelect={id => updateParams({ attacker: id })} variant="attacker" query={query} />
      <WizardNavigation>
        <SecondaryButton onClick={() => navigate(`/wizard/mode${buildSearch({})}`)}>← Back</SecondaryButton>
        <Hint>{attackerId ? `Selected: ${operatives.find(o => o.id === attackerId)?.name}` : 'Select an attacker'}</Hint>
        <PrimaryButton disabled={!attackerId} onClick={() => navigate(`/wizard/defender${buildSearch({})}`)}>Next →</PrimaryButton>
      </WizardNavigation>
    </StepContainer>
  )
}
