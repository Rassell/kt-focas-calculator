import type { CalcResult } from '../../engine/calculator'

export function StatsOverview({ result }: { result: CalcResult }) {
  return (
    <div className="flex gap-2 flex-wrap items-center text-xs text-[#334155]">
      <span>Average Damage:</span><strong className="text-[#0f172a] text-[13px]">{result.avgDamage.toFixed(2)}</strong>
      <span>Injury Chance:</span><strong className="text-[#0f172a] text-[13px]">{(result.injuryChance * 100).toFixed(2)}%</strong>
      <span>Kill Chance:</span><strong className="text-[#0f172a] text-[13px]">{(result.killChance * 100).toFixed(2)}%</strong>
    </div>
  )
}
