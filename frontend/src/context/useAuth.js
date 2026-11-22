import { useContext } from 'react'
import AuthContext from './authContext'

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