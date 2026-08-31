import { useMemo, useState } from 'react'
import { calcResult, type Attacker, type Defender, type Situation } from '../engine/calculator'
import operativesData from '../data/operatives.json'

type Mode = 'shoot' | 'fight'

interface OperativePreset {
  id: string
  name: string
  faction: string
  role: string
  shoot: Attacker
  fight: Attacker
  defender: Defender
}

const operatives = operativesData as OperativePreset[]

function toAttacker(op: OperativePreset, mode: Mode): Attacker {
  return mode === 'shoot' ? op.shoot : op.fight
}

function toDefender(op: OperativePreset): Defender {
  return op.defender
}

function ModeCard({ mode, selected, onSelect }: { mode: Mode, selected: boolean, onSelect: () => void }) {
  const isShoot = mode === 'shoot'
  return (
    <button
      className={`wizard-mode-card ${selected ? 'selected' : ''}`}
      onClick={onSelect}
      type="button"
    >
      <span className="wizard-mode-icon">{isShoot ? '🎯' : '⚔️'}</span>
      <span className="wizard-mode-title">{isShoot ? 'Shoot' : 'Fight'}</span>
      <span className="wizard-mode-desc">{isShoot ? 'Ranged attack — use BS, cover & obscured' : 'Melee attack — use WS, close combat'}</span>
    </button>
  )
}

function OperativeCard({ op, mode, selected, onSelect, variant }: { op: OperativePreset, mode: Mode, selected: boolean, onSelect: () => void, variant: 'attacker' | 'defender' }) {
  const att = toAttacker(op, mode)
  const def = toDefender(op)
  return (
    <button
      className={`wizard-op-card ${selected ? 'selected' : ''}`}
      onClick={onSelect}
      type="button"
    >
      <div className="wizard-op-head">
        <span className="wizard-op-name">{op.name}</span>
        <span className="wizard-op-faction">{op.faction}</span>
      </div>
      <span className="wizard-op-role">{op.role}</span>
      {variant === 'attacker' ? (
        <div className="wizard-op-stats">
          <span>{att.attacks}A</span>
          <span>{att.bs}+</span>
          <span>{att.normalDmg}/{att.critDmg} dmg</span>
          {att.piercing > 0 && <span>Piercing {att.piercing}</span>}
          {att.lethal && <span>Lethal 5+</span>}
          {att.rending && <span>Rending</span>}
          {att.severe && <span>Severe</span>}
          {att.reroll !== 'none' && <span className="wizard-tag">{att.reroll}</span>}
        </div>
      ) : (
        <div className="wizard-op-stats">
          <span>{def.save}+ save</span>
          <span>{def.wounds}W</span>
          {def.coverSaves > 0 && <span>Cover {def.coverSaves}</span>}
          {def.indomitus && <span>Indomitus</span>}
          {def.obscured && <span>Obscured</span>}
        </div>
      )}
    </button>
  )
}

export default function Wizard() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [mode, setMode] = useState<Mode | null>(null)
  const [attackerId, setAttackerId] = useState<string | null>(null)
  const [defenderId, setDefenderId] = useState<string | null>(null)
  const [queryAtt, setQueryAtt] = useState('')
  const [queryDef, setQueryDef] = useState('')

  const attackerOp = useMemo(() => operatives.find(o => o.id === attackerId) ?? null, [attackerId])
  const defenderOp = useMemo(() => operatives.find(o => o.id === defenderId) ?? null, [defenderId])

  const situation: Situation | null = useMemo(() => {
    if (!mode || !attackerOp || !defenderOp) return null
    return {
      attacker: toAttacker(attackerOp, mode),
      defender: toDefender(defenderOp),
    }
  }, [mode, attackerOp, defenderOp])

  const result = useMemo(() => (situation ? calcResult(situation) : null), [situation])

  const filteredAttackers = useMemo(() => {
    const q = queryAtt.trim().toLowerCase()
    if (!q) return operatives
    return operatives.filter(o =>
      o.name.toLowerCase().includes(q) ||
      o.faction.toLowerCase().includes(q) ||
      o.role.toLowerCase().includes(q)
    )
  }, [queryAtt])

  const filteredDefenders = useMemo(() => {
    const q = queryDef.trim().toLowerCase()
    if (!q) return operatives
    return operatives.filter(o =>
      o.name.toLowerCase().includes(q) ||
      o.faction.toLowerCase().includes(q) ||
      o.role.toLowerCase().includes(q)
    )
  }, [queryDef])

  const canNextFrom1 = mode !== null
  const canNextFrom2 = attackerId !== null
  const canNextFrom3 = defenderId !== null

  function reset() {
    setStep(1)
    setMode(null)
    setAttackerId(null)
    setDefenderId(null)
    setQueryAtt('')
    setQueryDef('')
  }

  return (
    <div className="wizard">
      <div className="wizard-progress">
        {[1, 2, 3, 4].map(n => (
          <div key={n} className={`wizard-step-dot ${step === n ? 'active' : ''} ${step > n ? 'done' : ''}`}>
            <span className="wizard-step-num">{n}</span>
            <span className="wizard-step-label">
              {n === 1 ? 'Mode' : n === 2 ? 'Attacker' : n === 3 ? 'Defender' : 'Stats'}
            </span>
          </div>
        ))}
      </div>

      <div className="wizard-panel">
        {step === 1 && (
          <div className="wizard-step">
            <h3 className="wizard-title">Choose attack type</h3>
            <p className="wizard-subtitle">Will this be a shooting or fight attack? This affects which weapon profile is used.</p>
            <div className="wizard-mode-grid">
              <ModeCard mode="shoot" selected={mode === 'shoot'} onSelect={() => setMode('shoot')} />
              <ModeCard mode="fight" selected={mode === 'fight'} onSelect={() => setMode('fight')} />
            </div>
            <div className="wizard-actions">
              <span className="wizard-hint">{mode ? `Selected: ${mode === 'shoot' ? 'Shoot (BS)' : 'Fight (WS)'}` : 'Select one to continue'}</span>
              <button className="wizard-btn primary" disabled={!canNextFrom1} onClick={() => setStep(2)}>Next →</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="wizard-step">
            <h3 className="wizard-title">Select attacker — {mode === 'shoot' ? 'Shooter' : 'Fighter'}</h3>
            <p className="wizard-subtitle">Pick from predefined operatives. Stats are read from <code>src/data/operatives.json</code>.</p>
            <input
              className="wizard-search"
              placeholder="Search by name, faction or role…"
              value={queryAtt}
              onChange={e => setQueryAtt(e.target.value)}
            />
            <div className="wizard-op-grid">
              {filteredAttackers.map(op => (
                <OperativeCard
                  key={op.id}
                  op={op}
                  mode={mode!}
                  selected={attackerId === op.id}
                  onSelect={() => setAttackerId(op.id)}
                  variant="attacker"
                />
              ))}
              {filteredAttackers.length === 0 && <div className="wizard-empty">No operatives match “{queryAtt}”.</div>}
            </div>
            <div className="wizard-actions">
              <button className="wizard-btn" onClick={() => setStep(1)}>← Back</button>
              <span className="wizard-hint">{attackerOp ? `Selected: ${attackerOp.name}` : 'Select an attacker'}</span>
              <button className="wizard-btn primary" disabled={!canNextFrom2} onClick={() => setStep(3)}>Next →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="wizard-step">
            <h3 className="wizard-title">Select defender</h3>
            <p className="wizard-subtitle">Choose the target operative. Defensive stats (save, wounds, cover) come from the same JSON.</p>
            <input
              className="wizard-search"
              placeholder="Search by name, faction or role…"
              value={queryDef}
              onChange={e => setQueryDef(e.target.value)}
            />
            <div className="wizard-op-grid">
              {filteredDefenders.map(op => (
                <OperativeCard
                  key={op.id}
                  op={op}
                  mode={mode!}
                  selected={defenderId === op.id}
                  onSelect={() => setDefenderId(op.id)}
                  variant="defender"
                />
              ))}
              {filteredDefenders.length === 0 && <div className="wizard-empty">No operatives match “{queryDef}”.</div>}
            </div>
            <div className="wizard-actions">
              <button className="wizard-btn" onClick={() => setStep(2)}>← Back</button>
              <span className="wizard-hint">{defenderOp ? `Selected: ${defenderOp.name}` : 'Select a defender'}</span>
              <button className="wizard-btn primary" disabled={!canNextFrom3} onClick={() => setStep(4)}>Show stats →</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="wizard-step">
            <h3 className="wizard-title">Statistics</h3>
            {!situation || !result || !attackerOp || !defenderOp || !mode ? (
              <div className="wizard-empty">Missing selection — go back and pick a mode, attacker and defender.</div>
            ) : (
              <>
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
              </>
            )}
            <div className="wizard-actions">
              <button className="wizard-btn" onClick={() => setStep(3)}>← Back</button>
              <button className="wizard-btn" onClick={reset}>Start over</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
