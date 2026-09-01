import { useState } from 'react'
import { CssBaseline } from '@mui/material'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import CreateReportPage from './pages/CreateReportPage'
import { isAuthenticated } from './utils/authUtils'

type PageType = 'login' | 'register' | 'dashboard' | 'createReport'

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>(() => {
    // Check if user is already authenticated on initial load
    return isAuthenticated() ? 'dashboard' : 'login'
  })

  // Update page when authentication status changes
  const handleLoginSuccess = () => {
    setCurrentPage('dashboard')
  }

  const handleLogout = () => {
    setCurrentPage('login')
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'login':
        return (
          <LoginPage
            onSwitchToRegister={() => setCurrentPage('register')}
            onLoginSuccess={handleLoginSuccess}
          />
        )
      case 'register':
        return <RegisterPage onSwitchToLogin={() => setCurrentPage('login')} />
      case 'dashboard':
        return (
          <DashboardPage
            onLogout={handleLogout}
            onCreateReport={() => setCurrentPage('createReport')}
          />
        )
      case 'createReport':
        return (
          <CreateReportPage
            onBack={() => setCurrentPage('dashboard')}
            onSuccess={() => setCurrentPage('dashboard')}
          />
        )
      default:
        return <LoginPage onSwitchToRegister={() => setCurrentPage('register')} />
    }
  }

  return (
    <>
      <CssBaseline />
      {renderPage()}
    </>
  )
}

export default App
