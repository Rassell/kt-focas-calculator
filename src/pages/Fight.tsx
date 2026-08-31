import { useMemo, useState } from 'react'
import { calcResult, defaultAttacker, defaultDefender, type Attacker, type Defender, type Situation } from '../engine/calculator'

function IncDec({ label, value, min, max, step = 1, onChange, suffix, advanced, showAdvanced, hint }: { label: string, value: number, min: number, max: number, step?: number, onChange: (v: number) => void, suffix?: string, advanced?: boolean, showAdvanced?: boolean, hint?: string }) {
  if (advanced && !showAdvanced) return null
  return (
    <div className="field" title={hint}>
      <div className="field-label">{advanced && <span className="gear">⚙️ </span>}{label}{suffix && <span className="suffix"> {suffix}</span>}</div>
      <div className="stepper">
        <button className="step-btn" onClick={() => onChange(Math.max(min, value - step))} disabled={value <= min}>−</button>
        <span className="step-val">{value}</span>
        <button className="step-btn" onClick={() => onChange(Math.min(max, value + step))} disabled={value >= max}>+</button>
      </div>
    </div>
  )
}

function SelectField({ label, value, options, onChange, advanced, showAdvanced, hint }: { label: string, value: string, options: { v: string, l: string }[], onChange: (v: string) => void, advanced?: boolean, showAdvanced?: boolean, hint?: string }) {
  if (advanced && !showAdvanced) return null
  return (
    <div className="field" title={hint}>
      <div className="field-label">{advanced && <span className="gear">⚙️ </span>}{label}</div>
      <select className="select" value={value} onChange={e => onChange(e.target.value)}>
        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  )
}

function Toggle({ label, value, onChange, advanced, showAdvanced, hint }: { label: string, value: boolean, onChange: (v: boolean) => void, advanced?: boolean, showAdvanced?: boolean, hint?: string }) {
  if (advanced && !showAdvanced) return null
  return (
    <label className="toggle" title={hint}>
      <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} />
      <span>{advanced && <span className="gear">⚙️ </span>}{label}</span>
    </label>
  )
}

function SituationPanel({ title, sit, onChange, onCopyFrom, showAdvanced, setShowAdvanced }: { title: string, sit: Situation, onChange: (s: Situation) => void, onCopyFrom?: () => void, showAdvanced: boolean, setShowAdvanced: (v: boolean) => void }) {
  const updAtt = (patch: Partial<Attacker>) => onChange({ ...sit, attacker: { ...sit.attacker, ...patch } })
  const updDef = (patch: Partial<Defender>) => onChange({ ...sit, defender: { ...sit.defender, ...patch } })
  const res = useMemo(() => calcResult(sit), [sit])

  return (
    <div className="situation">
      <div className="situation-head">
        <h3>{title}</h3>
        <div className="head-actions">
          {onCopyFrom && <button className="copy-btn" onClick={onCopyFrom}>Copy From Situation 1</button>}
          <label className="adv-check"><input type="checkbox" checked={showAdvanced} onChange={e => setShowAdvanced(e.target.checked)} /> Advanced</label>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">Attacker — Fight</div>
        <div className="grid">
          <IncDec label="Attacks" value={sit.attacker.attacks} min={1} max={10} onChange={v => updAtt({ attacks: v })} />
          <SelectField label="WS" value={String(sit.attacker.bs)} options={[{ v: '2', l: '2+' }, { v: '3', l: '3+' }, { v: '4', l: '4+' }, { v: '5', l: '5+' }, { v: '6', l: '6+' }]} onChange={v => updAtt({ bs: Number(v) })} hint="Weapon Skill for fight" />
          <IncDec label="Normal Dmg" value={sit.attacker.normalDmg} min={1} max={10} onChange={v => updAtt({ normalDmg: v })} />
          <IncDec label="Crit Dmg" value={sit.attacker.critDmg} min={1} max={10} onChange={v => updAtt({ critDmg: v })} />
          <IncDec label="Devastating" value={sit.attacker.devastating} min={0} max={5} onChange={v => updAtt({ devastating: v })} advanced showAdvanced={showAdvanced} hint="MW per crit" />
          <IncDec label="Piercing" value={sit.attacker.piercing} min={0} max={3} onChange={v => updAtt({ piercing: v })} />
          <IncDec label="Piercing Crits" value={sit.attacker.piercingCrits} min={0} max={3} onChange={v => updAtt({ piercingCrits: v })} advanced showAdvanced={showAdvanced} hint="AP for crit saves only" />
          <SelectField label="Reroll" value={sit.attacker.reroll} options={[{ v: 'none', l: 'None' }, { v: 'balanced', l: 'Balanced' }, { v: 'relentless', l: 'Relentless' }, { v: 'ceaseless', l: 'Ceaseless (1s)' }, { v: 'balanced-ceaseless', l: 'Balanced + Ceaseless' }]} onChange={v => updAtt({ reroll: v as Attacker['reroll'] })} hint="Balanced rerolls 1 die, Relentless rerolls fails, Ceaseless rerolls 1s" />
          <Toggle label="Lethal 5+" value={sit.attacker.lethal} onChange={v => updAtt({ lethal: v })} hint="5+ is crit" />
          <IncDec label="Accurate" value={sit.attacker.accurate} min={0} max={3} onChange={v => updAtt({ accurate: v })} advanced showAdvanced={showAdvanced} hint="Retain X fails as normals" />
          <Toggle label="Rending" value={sit.attacker.rending} onChange={v => updAtt({ rending: v })} hint="If ≥1 crit, retain a normal as crit" />
          <Toggle label="Severe" value={sit.attacker.severe} onChange={v => updAtt({ severe: v })} hint="If no crits, change a normal to crit" />
          <Toggle label="Punishing" value={sit.attacker.punishing} onChange={v => updAtt({ punishing: v })} hint="Retain a fail as normal" />
          <IncDec label="Rounds" value={sit.attacker.rounds} min={1} max={4} onChange={v => updAtt({ rounds: v })} advanced showAdvanced={showAdvanced} />
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">Defender</div>
        <div className="grid">
          <SelectField label="Save" value={String(sit.defender.save)} options={[{ v: '2', l: '2+' }, { v: '3', l: '3+' }, { v: '4', l: '4+' }, { v: '5', l: '5+' }, { v: '6', l: '6+' }]} onChange={v => updDef({ save: Number(v) })} />
          <IncDec label="Wounds" value={sit.defender.wounds} min={1} max={20} onChange={v => updDef({ wounds: v })} />
          <IncDec label="Cover Saves" value={sit.defender.coverSaves} min={0} max={3} onChange={v => updDef({ coverSaves: v })} hint="Auto-retained saves" />
          <Toggle label="Indomitus" value={sit.defender.indomitus} onChange={v => updDef({ indomitus: v })} hint="Ignore AP" />
          <Toggle label="Obscured" value={sit.defender.obscured} onChange={v => updDef({ obscured: v })} hint="Crits become normals" />
          <Toggle label="JaS (Crits)" value={sit.defender.jasCrits} onChange={v => updDef({ jasCrits: v })} hint="Ignore one crit" />
          <Toggle label="JaS (Normals)" value={sit.defender.jasNormals} onChange={v => updDef({ jasNormals: v })} hint="Ignore one normal" />
        </div>
      </div>

      <div className="results">
        <div className="result-row">
          <span>Average Damage:</span><strong>{res.avgDamage.toFixed(2)}</strong>
          <span>Injury Chance:</span><strong>{(res.injuryChance * 100).toFixed(2)}%</strong>
          <span>Kill Chance:</span><strong>{(res.killChance * 100).toFixed(2)}%</strong>
        </div>
        <div className="hist">
          <div className="hist-title">Dmg probs for exact scenario</div>
          <div className="hist-bars">
            {res.histogram.slice(0, 16).map(h => (
              <div key={h.dmg} className="hist-bar" title={`${h.dmg} dmg: ${(h.prob * 100).toFixed(1)}%`}>
                <div className="bar" style={{ height: `${Math.max(2, h.prob * 300)}px` }} />
                <span className="bar-label">{h.dmg}</span>
                <span className="bar-prob">{(h.prob * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Fight() {
  const [s1, setS1] = useState<Situation>({ attacker: defaultAttacker(), defender: defaultDefender() })
  const [s2, setS2] = useState<Situation>({ attacker: defaultAttacker(), defender: { ...defaultDefender(), save: 4 } })
  const [advanced, setAdvanced] = useState(false)

  const r1 = useMemo(() => calcResult(s1), [s1])
  const r2 = useMemo(() => calcResult(s2), [s2])
  const banner = useMemo(() => {
    if (Math.abs(r1.avgDamage - r2.avgDamage) < 0.005) return 'Both situations deal equal damage — enjoy!'
    return r1.avgDamage > r2.avgDamage ? 'Situation 1 does more dmg, enjoy' : 'Situation 2 does more dmg, enjoy'
  }, [r1.avgDamage, r2.avgDamage])

  return (
    <>
      <div className="page-intro">
        <h2>Fight Calculator</h2>
        <p>Work out the odds of a melee attack — compare two fight situations side by side.</p>
      </div>
      <div className="situations">
        <SituationPanel title="Situation 1" sit={s1} onChange={setS1} showAdvanced={advanced} setShowAdvanced={setAdvanced} />
        <SituationPanel title="Situation 2" sit={s2} onChange={setS2} onCopyFrom={() => setS2({ attacker: { ...s1.attacker }, defender: { ...s1.defender } })} showAdvanced={advanced} setShowAdvanced={setAdvanced} />
      </div>
      <div className="banner">{banner} 🎲</div>
    </>
  )
}
