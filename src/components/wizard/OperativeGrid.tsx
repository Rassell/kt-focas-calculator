import type { Mode, Operative } from '../../types/operative'
import { OperativeCard } from './OperativeCard'

export function OperativeGrid({ operatives: ops, mode, selectedId, onSelect, variant, query }: { operatives: Operative[]; mode: Mode; selectedId: string | null; onSelect: (id: string) => void; variant: 'attacker' | 'defender'; query: string }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-2.5 max-h-[420px] overflow-y-auto p-0.5">
      {ops.map(op => (
        <OperativeCard key={op.id} op={op} mode={mode} selected={selectedId === op.id} onSelect={() => onSelect(op.id)} variant={variant} />
      ))}
      {ops.length === 0 && <div className="p-4 text-center text-[#64748b] text-[13px] col-span-full">No operatives match “{query}”.</div>}
    </div>
  )
}
