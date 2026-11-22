
import { useState } from 'react'
import API from '../services/api'

function Login({ onLogin }) {
  const [mode, setMode] = useState('login')

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const isRegister = mode === 'register'

  function switchMode(nextMode) {
    if (loading) return

    setMode(nextMode)
    setFullName('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setError('')
    setSuccessMessage('')
  }

  function getErrorMessage(error, fallback) {
    const detail = error.response?.data?.detail

    if (typeof detail === 'string') {
      return detail
    }

    if (Array.isArray(detail)) {
      return detail
        .map((item) => item.msg || 'Invalid field')
        .join(', ')
    }

    return error.response
      ? fallback
      : error.message || fallback
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (loading) return

    setError('')
    setSuccessMessage('')

    if (isRegister) {
      if (fullName.trim().length < 2) {
        setError('Full name must contain at least 2 characters.')
        return
      }

      if (password.length < 8 || password.length > 128) {
        setError('Password must contain 8 to 128 characters.')
        return
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match.')
        return
      }
    }

    setLoading(true)

    try {
      if (isRegister) {
        await API.post('/auth/register', {
          full_name: fullName.trim(),
          email: email.trim(),
          password
        })

        setMode('login')
        setPassword('')
        setConfirmPassword('')
        setFullName('')

        setSuccessMessage(
          'Account created successfully. Please sign in.'
        )

      } else {
        const response = await API.post('/auth/login', {
          email: email.trim(),
          password
        })

        const token = response.data.access_token

        if (!token) {
          throw new Error('Access token was not received')
        }

        onLogin(token)
      }

    } catch (error) {
      console.error(
        isRegister ? 'Registration failed:' : 'Login failed:',
        error
      )

      setError(
        getErrorMessage(
          error,
          isRegister
            ? 'Unable to register. Please check your details.'
            : 'Unable to login. Please try again.'
        )
      )

    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-8">

     <div className={`w-full transition-all duration-300 ${
  isRegister ? 'max-w-2xl' : 'max-w-md'
}`}>

        {/* Branding */}
        <div className="text-center mb-8">

          <div className="mx-auto h-14 w-14 rounded-xl bg-blue-600 flex items-center justify-center text-2xl font-bold text-white">
            I
          </div>

          <h1 className="text-2xl font-bold text-white mt-4">
            IncidentOps
          </h1>

          <p className="text-slate-400 mt-2 text-sm">
            Enterprise Incident Management Platform
          </p>

        </div>

        {/* Authentication Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-xl">

          <h2 className="text-xl font-semibold text-white">
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </h2>

          <p className="text-sm text-slate-400 mt-2 mb-6">
            {isRegister
              ? 'Register to access the IncidentOps workspace.'
              : 'Sign in to access your workspace.'}
          </p>

          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg p-3 text-sm mb-5">
              {successMessage}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 text-sm mb-5">
              {error}
            </div>
          )}

          <form
  onSubmit={handleSubmit}
  className={
    isRegister
      ? 'grid grid-cols-1 sm:grid-cols-2 gap-x-4'
      : ''
  }
>

            {/* Full Name - Registration Only */}
            {isRegister && (
              <div className="mb-4">

                <label
                  htmlFor="auth-full-name"
                  className="block text-sm text-slate-300 mb-2"
                >
                  Full Name
                </label>

                <input
                  id="auth-full-name"
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Enter your full name"
                  required
                  minLength={2}
                  maxLength={100}
                  autoComplete="name"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-blue-500"
                />

              </div>
            )}

            {/* Email */}
            <div className="mb-4">

              <label
                htmlFor="auth-email"
                className="block text-sm text-slate-300 mb-2"
              >
                Email Address
              </label>

              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="user@example.com"
                required
                autoComplete={isRegister ? 'email' : 'username'}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-blue-500"
              />

            </div>

            {/* Password */}
            <div className="mb-4">

              <label
                htmlFor="auth-password"
                className="block text-sm text-slate-300 mb-2"
              >
                Password
              </label>

              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={
                  isRegister
                    ? 'Minimum 8 characters'
                    : 'Enter your password'
                }
                required
                minLength={isRegister ? 8 : undefined}
                maxLength={isRegister ? 128 : undefined}
                autoComplete={
                  isRegister ? 'new-password' : 'current-password'
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-blue-500"
              />

            </div>

            {/* Confirm Password - Registration Only */}
            {isRegister && (
              <div className="mb-4">

                <label
                  htmlFor="auth-confirm-password"
                  className="block text-sm text-slate-300 mb-2"
                >
                  Confirm Password
                </label>

                <input
                  id="auth-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  placeholder="Re-enter your password"
                  required
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-blue-500"
                />

                <p className="text-xs text-slate-500 mt-2">
                  Password must contain 8 to 128 characters.
                </p>

              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-blue-600 hover:bg-blue-500
  disabled:bg-blue-800 disabled:cursor-not-allowed
  text-white font-semibold rounded-lg py-3 transition-colors
  ${isRegister ? 'sm:col-span-2' : ''}`}
            >
              {loading
                ? isRegister
                  ? 'Creating account...'
                  : 'Signing in...'
                : isRegister
                  ? 'Create Account'
                  : 'Sign In'}
            </button>

          </form>

          {/* Switch Between Login and Registration */}
          <div className="text-center mt-6">

            <p className="text-sm text-slate-400">
              {isRegister
                ? 'Already have an account?'
                : "Don't have an account?"}
            </p>

            <button
              type="button"
              disabled={loading}
              onClick={() =>
                switchMode(isRegister ? 'login' : 'register')
              }
              className="mt-2 text-sm font-semibold text-blue-400 hover:text-blue-300 disabled:opacity-50"
            >
              {isRegister
                ? 'Sign In'
                : 'Create an Account'}
            </button>

          </div>

        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          Secure Incident Management Workspace
        </p>

      </div>

    </div>
  )
}

export default Login
