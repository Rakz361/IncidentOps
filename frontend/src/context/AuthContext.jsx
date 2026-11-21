import {
  createContext,
  useContext,
  useEffect,
  useState
} from 'react'

import API from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore the current browser session
  useEffect(() => {
    async function restoreSession() {
      const savedToken = sessionStorage.getItem('access_token')

      if (!savedToken) {
        setLoading(false)
        return
      }

      try {
        API.defaults.headers.common.Authorization =
          `Bearer ${savedToken}`

        const response = await API.get('/auth/me')

        setToken(savedToken)
        setUser(response.data)

      } catch (error) {
        console.error('Session restoration failed:', error)

        sessionStorage.removeItem('access_token')
        delete API.defaults.headers.common.Authorization

        setToken(null)
        setUser(null)

      } finally {
        setLoading(false)
      }
    }

    restoreSession()
  }, [])

  // Login
  async function login(newToken) {
    sessionStorage.setItem('access_token', newToken)

    API.defaults.headers.common.Authorization =
      `Bearer ${newToken}`

    try {
      const response = await API.get('/auth/me')

      setToken(newToken)
      setUser(response.data)

    } catch (error) {
      sessionStorage.removeItem('access_token')
      delete API.defaults.headers.common.Authorization

      setToken(null)
      setUser(null)

      throw error
    }
  }

  // Logout
  function logout() {
    sessionStorage.removeItem('access_token')

    delete API.defaults.headers.common.Authorization

    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to access authentication data
export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider'
    )
  }

  return context
}