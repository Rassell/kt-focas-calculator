import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { operatives, OperativeCard, useWizardParams } from './shared'

export default function AttackerStep() {
  const { mode, attackerId, updateParams, buildSearch } = useWizardParams()
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

  return (
    <div className="wizard-step">
      <h3 className="wizard-title">Select attacker — {mode === 'shoot' ? 'Shooter' : 'Fighter'}</h3>
      <p className="wizard-subtitle">Pick from predefined operatives. Stats are read from <code>src/data/operatives.json</code>.</p>
      <input className="wizard-search" placeholder="Search by name, faction or role…" value={query} onChange={e => setQuery(e.target.value)} />
      <div className="wizard-op-grid">
        {filtered.map(op => (
          <OperativeCard key={op.id} op={op} mode={mode} selected={attackerId === op.id} onSelect={() => updateParams({ attacker: op.id })} variant="attacker" />
        ))}
        {filtered.length === 0 && <div className="wizard-empty">No operatives match “{query}”.</div>}
      </div>
      <div className="wizard-actions">
        <button className="wizard-btn" onClick={() => navigate(`/wizard/mode${buildSearch({})}`)}>← Back</button>
        <span className="wizard-hint">{attackerId ? `Selected: ${operatives.find(o => o.id === attackerId)?.name}` : 'Select an attacker'}</span>
        <button className="wizard-btn primary" disabled={!attackerId} onClick={() => navigate(`/wizard/defender${buildSearch({})}`)}>Next →</button>
      </div>
    </div>
  )
}
