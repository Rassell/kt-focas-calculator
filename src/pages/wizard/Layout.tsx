import { Outlet } from 'react-router-dom'
import { WizardSteps } from '../../components/wizard/WizardSteps'

export default function WizardLayout() {
  return (
    <div className="flex flex-col gap-4">
      <div className="mb-3.5">
        <h2 className="m-0 mb-1 text-[18px] text-[#0f172a] font-semibold">Wizard</h2>
        <p className="m-0 text-[13px] text-[#64748b]">Step through a guided calculation — pick shoot or fight, then choose your operative and target.</p>
      </div>

      <WizardSteps variant="progress" />

      <div className="bg-white border border-[#e2e6f0] rounded-xl overflow-hidden">
        <Outlet />
      </div>
    </div>
  )
}
