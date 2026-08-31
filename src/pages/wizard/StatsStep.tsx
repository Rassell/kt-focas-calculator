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
      <div className="p-[18px]">
        <div className="p-4 text-center text-[#64748b] text-[13px]">Missing selection — go back and pick a mode, attacker and defender.</div>
        <div className="flex gap-2.5 items-center justify-between mt-4 flex-wrap">
          <button className="px-3.5 py-2 rounded-lg border border-[#dbe0ea] bg-white text-[#0f172a] text-[13px] font-semibold cursor-pointer hover:bg-[#f8fafc] hover:border-[#c7d2fe]" onClick={() => navigate(`/wizard/mode${buildSearch({})}`)}>← Start</button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-[18px]">
      <h3 className="m-0 mb-1.5 text-base text-[#0f172a] font-semibold">Statistics</h3>
      <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center mb-4 max-[700px]:grid-cols-1">
        <div className="bg-[#f8fafc] border border-[#e2e6f0] rounded-[10px] p-3">
          <div className="text-[11px] font-bold tracking-[0.06em] uppercase text-[#64748b] mb-1">{mode === 'shoot' ? 'Shooter' : 'Fighter'}</div>
          <div className="text-sm font-bold text-[#0f172a]">{attackerOp.name}</div>
          <div className="text-xs text-[#64748b] mb-2">{attackerOp.faction} · {attackerOp.role}</div>
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            {(() => {
              const a = toAttacker(attackerOp, mode)
              const pill = 'bg-white border border-[#e2e6f0] px-[7px] py-[3px] rounded-full text-[#334155]'
              return (
                <>
                  <span className={pill}>{a.attacks} Attacks</span>
                  <span className={pill}>{a.bs}+ {mode === 'shoot' ? 'BS' : 'WS'}</span>
                  <span className={pill}>{a.normalDmg}/{a.critDmg} dmg</span>
                  {a.piercing > 0 && <span className={pill}>Piercing {a.piercing}</span>}
                  {a.piercingCrits > 0 && <span className={pill}>Piercing Crits {a.piercingCrits}</span>}
                  {a.devastating > 0 && <span className={pill}>Devastating {a.devastating}</span>}
                  {a.lethal && <span className={pill}>Lethal 5+</span>}
                  {a.rending && <span className={pill}>Rending</span>}
                  {a.severe && <span className={pill}>Severe</span>}
                  {a.punishing && <span className={pill}>Punishing</span>}
                  {a.accurate > 0 && <span className={pill}>Accurate {a.accurate}</span>}
                  {a.reroll !== 'none' && <span className={pill}>{a.reroll}</span>}
                  {a.rounds > 1 && <span className={pill}>{a.rounds} rounds</span>}
                </>
              )
            })()}
          </div>
        </div>
        <div className="text-[13px] font-bold text-[#6366f1] uppercase tracking-[0.08em] text-center max-[700px]:text-center">vs</div>
        <div className="bg-[#f8fafc] border border-[#e2e6f0] rounded-[10px] p-3">
          <div className="text-[11px] font-bold tracking-[0.06em] uppercase text-[#64748b] mb-1">Defender</div>
          <div className="text-sm font-bold text-[#0f172a]">{defenderOp.name}</div>
          <div className="text-xs text-[#64748b] mb-2">{defenderOp.faction} · {defenderOp.role}</div>
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            {(() => {
              const d = toDefender(defenderOp)
              const pill = 'bg-white border border-[#e2e6f0] px-[7px] py-[3px] rounded-full text-[#334155]'
              return (
                <>
                  <span className={pill}>{d.save}+ Save</span>
                  <span className={pill}>{d.wounds} Wounds</span>
                  {d.coverSaves > 0 && <span className={pill}>Cover {d.coverSaves}</span>}
                  {d.indomitus && <span className={pill}>Indomitus</span>}
                  {d.obscured && <span className={pill}>Obscured</span>}
                  {d.jasCrits && <span className={pill}>JaS Crits</span>}
                  {d.jasNormals && <span className={pill}>JaS Normals</span>}
                </>
              )
            })()}
          </div>
        </div>
      </div>

      {result && (
        <div className="rounded-[10px] border border-[#e2e6f0] overflow-hidden bg-[#f8fafc] p-3">
          <div className="flex gap-2 flex-wrap items-center text-xs text-[#334155]">
            <span>Average Damage:</span><strong className="text-[#0f172a] text-[13px]">{result.avgDamage.toFixed(2)}</strong>
            <span>Injury Chance:</span><strong className="text-[#0f172a] text-[13px]">{(result.injuryChance * 100).toFixed(2)}%</strong>
            <span>Kill Chance:</span><strong className="text-[#0f172a] text-[13px]">{(result.killChance * 100).toFixed(2)}%</strong>
          </div>
          <div className="mt-2.5">
            <div className="text-[11px] font-semibold text-[#64748b] mb-1.5">Damage probability — exact enumeration</div>
            <div className="flex gap-1 items-end overflow-x-auto pb-1">
              {result.histogram.slice(0, 20).map(h => (
                <div key={h.dmg} className="flex flex-col items-center gap-0.5 min-w-7" title={`${h.dmg} dmg: ${(h.prob * 100).toFixed(1)}%`}>
                  <div className="w-[18px] bg-[#6366f1] rounded-t-[3px]" style={{ height: `${Math.max(2, h.prob * 300)}px` }} />
                  <span className="text-[10px] text-[#475569]">{h.dmg}</span>
                  <span className="text-[10px] text-[#64748b]">{(h.prob * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-3">
            <div className="text-[11px] font-semibold text-[#64748b] mb-1.5">Exact probabilities</div>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {result.histogram.map(h => (
                <span key={h.dmg} className="text-[11px] bg-white border border-[#e2e6f0] px-[7px] py-1 rounded-md text-[#334155]">
                  {h.dmg} dmg: {(h.prob * 100).toFixed(2)}%
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2.5 items-center justify-between mt-4 flex-wrap">
        <button className="px-3.5 py-2 rounded-lg border border-[#dbe0ea] bg-white text-[#0f172a] text-[13px] font-semibold cursor-pointer hover:bg-[#f8fafc] hover:border-[#c7d2fe]" onClick={() => navigate(`/wizard/defender${buildSearch({})}`)}>← Back</button>
        <button className="px-3.5 py-2 rounded-lg border border-[#dbe0ea] bg-white text-[#0f172a] text-[13px] font-semibold cursor-pointer hover:bg-[#f8fafc] hover:border-[#c7d2fe]" onClick={() => navigate('/wizard/mode')}>Start over</button>
      </div>
    </div>
  )
}
