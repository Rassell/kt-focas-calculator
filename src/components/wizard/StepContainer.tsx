export function StepContainer({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="p-[18px]">
      <h3 className="m-0 mb-1.5 text-base text-[#0f172a] font-semibold">{title}</h3>
      {description && <p className="m-0 mb-3.5 text-[13px] text-[#64748b]">{description}</p>}
      {children}
    </div>
  )
}

export function StepGuard({ message, action }: { message: string; action: React.ReactNode }) {
  return (
    <div className="p-[18px]">
      <div className="p-4 text-center text-[#64748b] text-[13px]">{message}</div>
      <div className="flex gap-2.5 items-center justify-between mt-4 flex-wrap">{action}</div>
    </div>
  )
}
