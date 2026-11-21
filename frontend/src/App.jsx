
import { useState } from 'react'

import {
  AuthProvider,
  useAuth
} from './context/AuthContext'

import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Incidents from './pages/Incidents'
import Services from './pages/Services'
import Users from './pages/Users'

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
        return <Dashboard />

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
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  )
}

export default App
