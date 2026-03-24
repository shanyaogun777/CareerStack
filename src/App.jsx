import { lazy, Suspense, useState } from 'react'
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { LandingPage } from './pages/LandingPage'
import { SettingsDrawer } from './components/layout/SettingsDrawer'
import { appPath } from './lib/appPaths'

const Dashboard = lazy(() =>
  import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })),
)
const ExperienceLibrary = lazy(() =>
  import('./components/experiences/ExperienceLibrary').then((m) => ({
    default: m.ExperienceLibrary,
  })),
)
const ResumeEditor = lazy(() =>
  import('./pages/ResumeEditor').then((m) => ({ default: m.ResumeEditor })),
)
const JobsPage = lazy(() =>
  import('./pages/JobsPage').then((m) => ({ default: m.JobsPage })),
)
const InterviewHubPage = lazy(() =>
  import('./pages/InterviewHubPage').then((m) => ({
    default: m.InterviewHubPage,
  })),
)
const InterviewWorkspacePage = lazy(() =>
  import('./pages/InterviewWorkspacePage').then((m) => ({
    default: m.InterviewWorkspacePage,
  })),
)
const AuthPage = lazy(() =>
  import('./pages/AuthPage').then((m) => ({ default: m.AuthPage })),
)

function PageFallback() {
  return (
    <div className="flex flex-1 items-center justify-center py-24 text-sm text-slate-500">
      加载中…
    </div>
  )
}

function AppShell() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const location = useLocation()
  const paddedMain = !location.pathname.startsWith(appPath('resume'))

  return (
    <>
      <AppLayout
        paddedMain={paddedMain}
        onOpenSettings={() => setSettingsOpen(true)}
      >
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </AppLayout>
      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="login"
        element={
          <Suspense fallback={<PageFallback />}>
            <AuthPage />
          </Suspense>
        }
      />
      <Route path="app" element={<AppShell />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="experiences" element={<ExperienceLibrary />} />
        <Route path="resume" element={<ResumeEditor />} />
        <Route path="jobs" element={<JobsPage />} />
        <Route path="interview" element={<InterviewHubPage />} />
        <Route path="interview/:jobId" element={<InterviewWorkspacePage />} />
        <Route
          path="*"
          element={<Navigate to={appPath('dashboard')} replace />}
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
