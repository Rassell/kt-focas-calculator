const primaryBtn = 'px-3.5 py-2 rounded-lg border text-[13px] font-semibold cursor-pointer transition-colors disabled:opacity-45 disabled:cursor-not-allowed bg-[#6366f1] text-white border-[#6366f1] hover:bg-[#4f46e5] disabled:hover:bg-[#6366f1]'
const secondaryBtn = 'px-3.5 py-2 rounded-lg border border-[#dbe0ea] bg-white text-[#0f172a] text-[13px] font-semibold cursor-pointer hover:bg-[#f8fafc] hover:border-[#c7d2fe]'

export function WizardNavigation({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-2.5 items-center justify-between mt-4 flex-wrap">{children}</div>
}

export function PrimaryButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={primaryBtn} {...props}>{children}</button>
}

export function SecondaryButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={secondaryBtn} {...props}>{children}</button>
}

export function Hint({ children }: { children: React.ReactNode }) {
  return <span className="text-xs text-[#64748b]">{children}</span>
}
