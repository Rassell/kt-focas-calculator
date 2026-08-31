import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { calcResult, type Situation } from '../../engine/calculator'
import { toAttacker, toDefender, useWizardParams } from './shared'

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
      <div className="wizard-step">
        <div className="wizard-empty">Missing selection — go back and pick a mode, attacker and defender.</div>
        <div className="wizard-actions">
          <button className="wizard-btn" onClick={() => navigate(`/wizard/mode${buildSearch({})}`)}>← Start</button>
        </div>
      </div>
    )
  }

  return (
    <div className="wizard-step">
      <h3 className="wizard-title">Statistics</h3>
      <div className="wizard-summary">
        <div className="wizard-summary-card">
          <div className="wizard-summary-label">{mode === 'shoot' ? 'Shooter' : 'Fighter'}</div>
          <div className="wizard-summary-name">{attackerOp.name}</div>
          <div className="wizard-summary-meta">{attackerOp.faction} · {attackerOp.role}</div>
          <div className="wizard-summary-stats">
            {(() => {
              const a = toAttacker(attackerOp, mode)
              return (
                <>
                  <span>{a.attacks} Attacks</span>
                  <span>{a.bs}+ {mode === 'shoot' ? 'BS' : 'WS'}</span>
                  <span>{a.normalDmg}/{a.critDmg} dmg</span>
                  {a.piercing > 0 && <span>Piercing {a.piercing}</span>}
                  {a.piercingCrits > 0 && <span>Piercing Crits {a.piercingCrits}</span>}
                  {a.devastating > 0 && <span>Devastating {a.devastating}</span>}
                  {a.lethal && <span>Lethal 5+</span>}
                  {a.rending && <span>Rending</span>}
                  {a.severe && <span>Severe</span>}
                  {a.punishing && <span>Punishing</span>}
                  {a.accurate > 0 && <span>Accurate {a.accurate}</span>}
                  {a.reroll !== 'none' && <span>{a.reroll}</span>}
                  {a.rounds > 1 && <span>{a.rounds} rounds</span>}
                </>
              )
            })()}
          </div>
        </div>
        <div className="wizard-vs">vs</div>
        <div className="wizard-summary-card">
          <div className="wizard-summary-label">Defender</div>
          <div className="wizard-summary-name">{defenderOp.name}</div>
          <div className="wizard-summary-meta">{defenderOp.faction} · {defenderOp.role}</div>
          <div className="wizard-summary-stats">
            {(() => {
              const d = toDefender(defenderOp)
              return (
                <>
                  <span>{d.save}+ Save</span>
                  <span>{d.wounds} Wounds</span>
                  {d.coverSaves > 0 && <span>Cover {d.coverSaves}</span>}
                  {d.indomitus && <span>Indomitus</span>}
                  {d.obscured && <span>Obscured</span>}
                  {d.jasCrits && <span>JaS Crits</span>}
                  {d.jasNormals && <span>JaS Normals</span>}
                </>
              )
            })()}
          </div>
        </div>
      </div>

      {result && (
        <div className="results wizard-results">
          <div className="result-row">
            <span>Average Damage:</span><strong>{result.avgDamage.toFixed(2)}</strong>
            <span>Injury Chance:</span><strong>{(result.injuryChance * 100).toFixed(2)}%</strong>
            <span>Kill Chance:</span><strong>{(result.killChance * 100).toFixed(2)}%</strong>
          </div>
          <div className="hist">
            <div className="hist-title">Damage probability — exact enumeration</div>
            <div className="hist-bars">
              {result.histogram.slice(0, 20).map(h => (
                <div key={h.dmg} className="hist-bar" title={`${h.dmg} dmg: ${(h.prob * 100).toFixed(1)}%`}>
                  <div className="bar" style={{ height: `${Math.max(2, h.prob * 300)}px` }} />
                  <span className="bar-label">{h.dmg}</span>
                  <span className="bar-prob">{(h.prob * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="wizard-prob-table">
            <div className="hist-title">Exact probabilities</div>
            <div className="wizard-prob-rows">
              {result.histogram.map(h => (
                <span key={h.dmg} className="wizard-prob-row">
                  {h.dmg} dmg: {(h.prob * 100).toFixed(2)}%
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="wizard-actions">
        <button className="wizard-btn" onClick={() => navigate(`/wizard/defender${buildSearch({})}`)}>← Back</button>
        <button className="wizard-btn" onClick={() => navigate('/wizard/mode')}>Start over</button>
      </div>
    </div>
  )
}
