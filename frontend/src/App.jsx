import { useState } from 'react'

import { AuthProvider } from './context/AuthProvider'
import { useAuth } from './context/useAuth'

import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Incidents from './pages/Incidents'
import Services from './pages/Services'
import Users from './pages/Users'
import AcceptInvitation from './pages/AcceptInvitation'

function AuthenticatedApp() {
  const {
    token,
    user,
    loading,
    login,
    logout
  } = useAuth()

  const [activePage, setActivePage] = useState('Dashboard')

  // Wait until the saved login session is checked
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        Checking authentication...
      </div>
    )
  }

  // If the user is not logged in, show Login
  if (!token) {
    return <Login onLogin={login} />
  }

  // Display the selected page
  function renderPage() {
    switch (activePage) {
      case 'Dashboard':
        return <Dashboard onNavigate={setActivePage} />

      case 'Incidents':
        return <Incidents />

      case 'Services':
        return <Services />

      case 'Users':
        return <Users />

      default:
        return <Dashboard />
    }
  }

  return (
    <MainLayout
      activePage={activePage}
      onNavigate={setActivePage}
      user={user}
      onLogout={logout}
    >
      {renderPage()}
    </MainLayout>
  )
}

function App() {

  // Public invitation page - authentication is not required
  if (window.location.pathname === '/accept-invitation') {
    return <AcceptInvitation />
  }

  // Existing authenticated application
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  )
}

export default App