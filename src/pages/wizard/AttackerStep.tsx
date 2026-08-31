import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { OperativeGrid } from '../../components/wizard/OperativeGrid'
import { WeaponProfilePicker } from '../../components/wizard/WeaponProfilePicker'
import { useFilteredOperatives } from '../../hooks/useFilteredOperatives'
import { OperativeSearchInput } from '../../components/wizard/OperativeSearchInput'
import { StepContainer, StepGuard } from '../../components/wizard/StepContainer'
import { Hint, PrimaryButton, SecondaryButton, WizardNavigation } from '../../components/wizard/WizardNavigation'
import { getWeapons } from '../../data/operatives'
import { useWizardParams } from '../../hooks/useWizardParams'

export default function AttackerStep() {
  const { mode, attackerId, attackerOp, attackerWeaponId, attackerProfileId, attackerWeapon, attackerProfile, hasAttackerProfile, updateParams, buildSearch } = useWizardParams()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const filtered = useFilteredOperatives(query, mode)

  // Auto-select single weapon/profile for smoother flow
  useEffect(() => {
    if (!attackerOp || !mode) return
    const weapons = getWeapons(attackerOp, mode)
    if (weapons.length === 1 && !attackerWeaponId) {
      updateParams({ weapon: weapons[0].id })
    }
  }, [attackerOp, mode, attackerWeaponId, updateParams])

  useEffect(() => {
    if (!attackerWeapon) return
    if (attackerWeapon.profiles.length === 1 && !attackerProfileId) {
      updateParams({ profile: attackerWeapon.profiles[0].id })
    }
  }, [attackerWeapon, attackerProfileId, updateParams])

  if (!mode) {
    return (
      <StepGuard message="Pick a mode first." action={<SecondaryButton onClick={() => navigate(`/wizard/mode${buildSearch({})}`)}>← Go to Mode</SecondaryButton>} />
    )
  }

  const hint = hasAttackerProfile && attackerOp && attackerWeapon && attackerProfile
    ? `Selected: ${attackerOp.name} · ${attackerWeapon.name} · ${attackerProfile.name}`
    : attackerId
      ? 'Pick a weapon and profile'
      : 'Select an attacker'

  return (
    <StepContainer title={`Select attacker — ${mode === 'shoot' ? 'Shooter' : 'Fighter'}`} description="Pick an operative, then choose a weapon and profile. Stats are read from src/data/operatives.json.">
      <OperativeSearchInput value={query} onChange={setQuery} />
      <OperativeGrid operatives={filtered} mode={mode} selectedId={attackerId} onSelect={id => updateParams({ attacker: id })} variant="attacker" query={query} />
      {attackerOp && (
        <div className="mt-4">
          <WeaponProfilePicker
            operative={attackerOp}
            mode={mode}
            selectedWeaponId={attackerWeaponId}
            selectedProfileId={attackerProfileId}
            onSelectWeapon={weaponId => updateParams({ weapon: weaponId })}
            onSelectProfile={(weaponId, profileId) => updateParams({ weapon: weaponId, profile: profileId })}
          />
        </div>
      )}
      <WizardNavigation>
        <SecondaryButton onClick={() => navigate(`/wizard/mode${buildSearch({})}`)}>← Back</SecondaryButton>
        <Hint>{hint}</Hint>
        <PrimaryButton disabled={!hasAttackerProfile} onClick={() => navigate(`/wizard/defender${buildSearch({})}`)}>Next →</PrimaryButton>
      </WizardNavigation>
    </StepContainer>
  )
}
