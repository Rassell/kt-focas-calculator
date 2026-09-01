import { Navigate, Route, Routes } from 'react-router-dom'
import { InstallBanner } from './components/InstallBanner'
import { AppFooter } from './components/layout/AppFooter'
import { AppHeader } from './components/layout/AppHeader'
import WizardLayout from './pages/wizard/Layout'
import ModeStep from './pages/wizard/ModeStep'
import AttackerStep from './pages/wizard/AttackerStep'
import DefenderStep from './pages/wizard/DefenderStep'
import StatsStep from './pages/wizard/StatsStep'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)]">
      <AppHeader />

      <main className="max-w-[1280px] mx-auto px-5 py-[18px] flex-1 w-full box-border">
        <Routes>
          <Route path="/" element={<Navigate to="/wizard/mode" replace />} />
          <Route path="/wizard" element={<WizardLayout />}>
            <Route index element={<Navigate to="mode" replace />} />
            <Route path="mode" element={<ModeStep />} />
            <Route path="attacker" element={<AttackerStep />} />
            <Route path="defender" element={<DefenderStep />} />
            <Route path="stats" element={<StatsStep />} />
          </Route>
          <Route path="*" element={<Navigate to="/wizard/mode" replace />} />
        </Routes>
      </main>

      <AppFooter />
      <InstallBanner />
    </div>
  )
}
