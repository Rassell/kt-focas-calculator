export function Pill({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'tag' | 'white' }) {
  const base = 'px-1.5 py-0.5 rounded-full border text-[11px]'
  const styles = {
    default: 'bg-[#f1f5f9] border-[#e2e6f0] text-[#334155]',
    tag: 'bg-[#eef2ff] border-[#c7d2fe] text-[#4338ca]',
    white: 'bg-white border-[#e2e6f0] px-[7px] py-[3px] text-[#334155]',
  } as const
  return <span className={`${base} ${styles[variant]}`}>{children}</span>
}
