import { Outlet } from 'react-router-dom'
import { WizardSteps } from '../../components/wizard/WizardSteps'

export default function WizardLayout() {
  return (
    <div className="flex flex-col gap-4">
      <WizardSteps variant="progress" />
      <div className="bg-white border border-[#e2e6f0] rounded-xl overflow-hidden">
        <Outlet />
      </div>
    </div>
  )
}
