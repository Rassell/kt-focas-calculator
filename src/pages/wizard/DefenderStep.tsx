import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { operatives, OperativeCard, useWizardParams } from './shared'

export default function DefenderStep() {
  const { mode, attackerId, defenderId, updateParams, buildSearch } = useWizardParams()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return operatives
    return operatives.filter(o => o.name.toLowerCase().includes(q) || o.faction.toLowerCase().includes(q) || o.role.toLowerCase().includes(q))
  }, [query])

  if (!mode) {
    return (
      <div className="wizard-step">
        <div className="wizard-empty">Pick a mode first.</div>
        <div className="wizard-actions"><button className="wizard-btn" onClick={() => navigate(`/wizard/mode${buildSearch({})}`)}>← Go to Mode</button></div>
      </div>
    )
  }
  if (!attackerId) {
    return (
      <div className="wizard-step">
        <div className="wizard-empty">Pick an attacker first.</div>
        <div className="wizard-actions"><button className="wizard-btn" onClick={() => navigate(`/wizard/attacker${buildSearch({})}`)}>← Go to Attacker</button></div>
      </div>
    )
  }

  return (
    <div className="wizard-step">
      <h3 className="wizard-title">Select defender</h3>
      <p className="wizard-subtitle">Choose the target operative. Defensive stats (save, wounds, cover) come from the same JSON.</p>
      <input className="wizard-search" placeholder="Search by name, faction or role…" value={query} onChange={e => setQuery(e.target.value)} />
      <div className="wizard-op-grid">
        {filtered.map(op => (
          <OperativeCard key={op.id} op={op} mode={mode} selected={defenderId === op.id} onSelect={() => updateParams({ defender: op.id })} variant="defender" />
        ))}
        {filtered.length === 0 && <div className="wizard-empty">No operatives match “{query}”.</div>}
      </div>
      <div className="wizard-actions">
        <button className="wizard-btn" onClick={() => navigate(`/wizard/attacker${buildSearch({})}`)}>← Back</button>
        <span className="wizard-hint">{defenderId ? `Selected: ${operatives.find(o => o.id === defenderId)?.name}` : 'Select a defender'}</span>
        <button className="wizard-btn primary" disabled={!defenderId} onClick={() => navigate(`/wizard/stats${buildSearch({})}`)}>Show stats →</button>
      </div>
    </div>
  )
}
