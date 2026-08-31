export function OperativeSearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      className="w-full px-2.5 py-2 border border-[#dbe0ea] rounded-lg text-[13px] mb-3 box-border focus:outline-none focus:border-[#6366f1] focus:ring-[3px] focus:ring-[rgba(99,102,241,0.15)]"
      placeholder="Search by name, faction or role…"
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  )
}
