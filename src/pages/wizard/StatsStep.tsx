import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AttackerSummaryCard } from '../../components/stats/AttackerSummaryCard'
import { DefenderSummaryCard } from '../../components/stats/DefenderSummaryCard'
import { DamageHistogram, ExactProbabilities } from '../../components/stats/DamageHistogram'
import { StatsOverview } from '../../components/stats/StatsOverview'
import { StepGuard } from '../../components/wizard/StepContainer'
import { SecondaryButton, WizardNavigation } from '../../components/wizard/WizardNavigation'
import { toAttacker, toDefender } from '../../data/operatives'
import { calcResult, type Situation } from '../../engine/calculator'
import { useWizardParams } from '../../hooks/useWizardParams'

export default function StatsStep() {
  const { mode, attackerOp, attackerWeapon, attackerProfile, defenderOp, buildSearch } = useWizardParams()
  const navigate = useNavigate()

  const situation: Situation | null = useMemo(() => {
    if (!mode || !attackerProfile || !defenderOp) return null
    return { attacker: toAttacker(attackerProfile), defender: toDefender(defenderOp) }
  }, [mode, attackerProfile, defenderOp])

  const result = useMemo(() => (situation ? calcResult(situation) : null), [situation])

  if (!mode) {
    return <StepGuard message="Pick a mode first." action={<SecondaryButton onClick={() => navigate(`/wizard/mode${buildSearch({})}`)}>← Go to Mode</SecondaryButton>} />
  }
  if (!attackerOp || !attackerWeapon || !attackerProfile) {
    return <StepGuard message="Pick an attacker weapon/profile first." action={<SecondaryButton onClick={() => navigate(`/wizard/attacker${buildSearch({})}`)}>← Go to Attacker</SecondaryButton>} />
  }
  if (!defenderOp) {
    return <StepGuard message="Pick a defender first." action={<SecondaryButton onClick={() => navigate(`/wizard/defender${buildSearch({})}`)}>← Go to Defender</SecondaryButton>} />
  }

  return (
    <div className="p-[18px]">
      <h3 className="m-0 mb-1.5 text-base text-[#0f172a] font-semibold">Statistics</h3>
      <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center mb-4 max-[700px]:grid-cols-1">
        <AttackerSummaryCard operative={attackerOp} weapon={attackerWeapon} profile={attackerProfile} mode={mode} />
        <div className="text-[13px] font-bold text-[#6366f1] uppercase tracking-[0.08em] text-center max-[700px]:text-center">vs</div>
        <DefenderSummaryCard op={defenderOp} />
      </div>

      {result && (
        <div className="rounded-[10px] border border-[#e2e6f0] overflow-hidden bg-[#f8fafc] p-3">
          <StatsOverview result={result} />
          <DamageHistogram result={result} />
          <ExactProbabilities result={result} />
        </div>
      )}

      <WizardNavigation>
        <SecondaryButton onClick={() => navigate(`/wizard/defender${buildSearch({})}`)}>← Back</SecondaryButton>
        <SecondaryButton onClick={() => navigate('/wizard/mode')}>Start over</SecondaryButton>
      </WizardNavigation>
    </div>
  )
}
