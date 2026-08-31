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
  const { mode, attackerOp, defenderOp, buildSearch } = useWizardParams()
  const navigate = useNavigate()

  const situation: Situation | null = useMemo(() => {
    if (!mode || !attackerOp || !defenderOp) return null
    return { attacker: toAttacker(attackerOp, mode), defender: toDefender(defenderOp) }
  }, [mode, attackerOp, defenderOp])

  const result = useMemo(() => (situation ? calcResult(situation) : null), [situation])

  if (!mode || !attackerOp || !defenderOp) {
    return (
      <StepGuard message="Missing selection — go back and pick a mode, attacker and defender." action={<SecondaryButton onClick={() => navigate(`/wizard/mode${buildSearch({})}`)}>← Start</SecondaryButton>} />
    )
  }

  return (
    <div className="p-[18px]">
      <h3 className="m-0 mb-1.5 text-base text-[#0f172a] font-semibold">Statistics</h3>
      <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center mb-4 max-[700px]:grid-cols-1">
        <AttackerSummaryCard op={attackerOp} mode={mode} />
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
