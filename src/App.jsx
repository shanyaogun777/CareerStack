import { useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { SettingsDrawer } from './components/layout/SettingsDrawer'
import { ExperienceLibrary } from './components/experiences/ExperienceLibrary'
import { ResumeEditor } from './pages/ResumeEditor'
import { JobsPage } from './pages/JobsPage'
import { InterviewHubPage } from './pages/InterviewHubPage'
import { InterviewWorkspacePage } from './pages/InterviewWorkspacePage'
import { Dashboard } from './pages/Dashboard'

function AppRoutes({ onOpenSettings }) {
  const location = useLocation()
  const paddedMain = !location.pathname.startsWith('/resume')

  return (
    <AppLayout paddedMain={paddedMain} onOpenSettings={onOpenSettings}>
      <Routes>
        <Route path="/" element={<Navigate to="/experiences" replace />} />
        <Route path="/experiences" element={<ExperienceLibrary />} />
        <Route path="/resume" element={<ResumeEditor />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/interview" element={<InterviewHubPage />} />
        <Route path="/interview/:jobId" element={<InterviewWorkspacePage />} />
        <Route path="*" element={<Navigate to="/experiences" replace />} />
      </Routes>
    </AppLayout>
  )
}

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <>
      <AppRoutes onOpenSettings={() => setSettingsOpen(true)} />
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  )
}
