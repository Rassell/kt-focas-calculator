import type { CalcResult } from '../../engine/calculator'

export function DamageHistogram({ result }: { result: CalcResult }) {
  return (
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
  )
}

export function ExactProbabilities({ result }: { result: CalcResult }) {
  return (
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
  )
}
