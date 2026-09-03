import { lazy, Suspense } from 'react'
import { Box, CircularProgress, CssBaseline } from '@mui/material'
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { isAuthenticated } from './utils/authUtils'
import { AnonymousOnly, RequireAuth } from './routes/AuthGuards'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const CreateReportPage = lazy(() => import('./pages/CreateReportPage'))
const ReportDetailPage = lazy(() => import('./pages/ReportDetailPage'))
const AdminUserDetailPage = lazy(() => import('./pages/AdminUserDetailPage'))
const PublicReportDetailPage = lazy(() => import('./pages/PublicReportDetailPage'))

// Validates URL params and rejects invalid values (non-positive, non-integer).
const parseRouteId = (value: string | undefined) => {
  if (!value) {
    return null
  }
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

const RouteFallback = () => {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <CircularProgress size={44} />
    </Box>
  )
}

// Route components that handle navigation and URL params.
const LoginRoute = () => {
  const navigate = useNavigate()
  // Render the LoginPage component and handle navigation on login success or switch to register
  return (
    <LoginPage
      onSwitchToRegister={() => navigate('/register')}
      onLoginSuccess={() => navigate('/dashboard', { replace: true })}
    />
  )
}

const RegisterRoute = () => {
  const navigate = useNavigate()
  // Render the RegisterPage component and handle navigation on switch to login
  return <RegisterPage onSwitchToLogin={() => navigate('/login')} />
}

const DashboardRoute = () => {
  const navigate = useNavigate()

  return (
    <DashboardPage
      onLogout={() => navigate('/login', { replace: true })}
      onCreateReport={() => navigate('/reports/new')}
      onViewReport={(reportId) => navigate(`/reports/${reportId}`)}
      onViewUser={(userId) => navigate(`/admin/users/${userId}`)}
    />
  )
}

const CreateReportRoute = () => {
  const navigate = useNavigate()

  return (
    <CreateReportPage
      onBack={() => navigate('/dashboard')}
      onSuccess={() => navigate('/dashboard', { replace: true })}
    />
  )
}

const ReportDetailRoute = () => {
  const navigate = useNavigate()
  const { reportId } = useParams<{ reportId: string }>()
  const parsedReportId = parseRouteId(reportId)

  if (parsedReportId === null) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <ReportDetailPage
      reportId={parsedReportId}
      onBack={() => navigate('/dashboard')}
      onLogout={() => navigate('/login', { replace: true })}
    />
  )
}

const AdminUserDetailRoute = () => {
  const navigate = useNavigate()
  const { userId } = useParams<{ userId: string }>()
  const parsedUserId = parseRouteId(userId)

  if (parsedUserId === null) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <AdminUserDetailPage
      userId={parsedUserId}
      onBack={() => navigate('/dashboard')}
      onLogout={() => navigate('/login', { replace: true })}
      onViewReport={(reportId) => navigate(`/reports/${reportId}`)}
    />
  )
}

const PublicReportDetailRoute = () => {
  const navigate = useNavigate()
  const { reportId } = useParams<{ reportId: string }>()
  const parsedReportId = parseRouteId(reportId)

  if (parsedReportId === null) {
    return <Navigate to="/" replace />
  }

  return (
    <PublicReportDetailPage
      reportId={parsedReportId}
      onBack={() => navigate(isAuthenticated() ? '/dashboard' : '/login', { replace: true })}
    />
  )
}

function App() {
  const defaultRoute = isAuthenticated() ? '/dashboard' : '/login'

  return (
    <>
      <CssBaseline />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Navigate to={defaultRoute} replace />} />
          <Route
            path="/login"
            element={
              <AnonymousOnly>
                <LoginRoute />
              </AnonymousOnly>
            }
          />
          <Route
            path="/register"
            element={
              <AnonymousOnly>
                <RegisterRoute />
              </AnonymousOnly>
            }
          />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <DashboardRoute />
              </RequireAuth>
            }
          />
          <Route
            path="/reports/new"
            element={
              <RequireAuth>
                <CreateReportRoute />
              </RequireAuth>
            }
          />
          <Route
            path="/reports/:reportId"
            element={
              <RequireAuth>
                <ReportDetailRoute />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/users/:userId"
            element={
              <RequireAuth>
                <AdminUserDetailRoute />
              </RequireAuth>
            }
          />
          <Route path="/reports/public/:reportId" element={<PublicReportDetailRoute />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  )
}

export default App
