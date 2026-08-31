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
      <div className="p-[18px]">
        <div className="p-4 text-center text-[#64748b] text-[13px]">Pick a mode first.</div>
        <div className="flex gap-2.5 items-center justify-between mt-4 flex-wrap"><button className="px-3.5 py-2 rounded-lg border border-[#dbe0ea] bg-white text-[#0f172a] text-[13px] font-semibold cursor-pointer hover:bg-[#f8fafc] hover:border-[#c7d2fe]" onClick={() => navigate(`/wizard/mode${buildSearch({})}`)}>← Go to Mode</button></div>
      </div>
    )
  }

  return (
    <div className="p-[18px]">
      <h3 className="m-0 mb-1.5 text-base text-[#0f172a] font-semibold">Select attacker — {mode === 'shoot' ? 'Shooter' : 'Fighter'}</h3>
      <p className="m-0 mb-3.5 text-[13px] text-[#64748b]">Pick from predefined operatives. Stats are read from <code className="bg-[#f1f5f9] px-1 py-0.5 rounded text-xs font-mono">src/data/operatives.json</code>.</p>
      <input className="w-full px-2.5 py-2 border border-[#dbe0ea] rounded-lg text-[13px] mb-3 box-border focus:outline-none focus:border-[#6366f1] focus:ring-[3px] focus:ring-[rgba(99,102,241,0.15)]" placeholder="Search by name, faction or role…" value={query} onChange={e => setQuery(e.target.value)} />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-2.5 max-h-[420px] overflow-y-auto p-0.5">
        {filtered.map(op => (
          <OperativeCard key={op.id} op={op} mode={mode} selected={attackerId === op.id} onSelect={() => updateParams({ attacker: op.id })} variant="attacker" />
        ))}
        {filtered.length === 0 && <div className="p-4 text-center text-[#64748b] text-[13px] col-span-full">No operatives match “{query}”.</div>}
      </div>
      <div className="flex gap-2.5 items-center justify-between mt-4 flex-wrap">
        <button className="px-3.5 py-2 rounded-lg border border-[#dbe0ea] bg-white text-[#0f172a] text-[13px] font-semibold cursor-pointer hover:bg-[#f8fafc] hover:border-[#c7d2fe]" onClick={() => navigate(`/wizard/mode${buildSearch({})}`)}>← Back</button>
        <span className="text-xs text-[#64748b]">{attackerId ? `Selected: ${operatives.find(o => o.id === attackerId)?.name}` : 'Select an attacker'}</span>
        <button className="px-3.5 py-2 rounded-lg border text-[13px] font-semibold cursor-pointer transition-colors disabled:opacity-45 disabled:cursor-not-allowed bg-[#6366f1] text-white border-[#6366f1] hover:bg-[#4f46e5] disabled:hover:bg-[#6366f1]" disabled={!attackerId} onClick={() => navigate(`/wizard/defender${buildSearch({})}`)}>Next →</button>
      </div>
    </div>
  )
}
