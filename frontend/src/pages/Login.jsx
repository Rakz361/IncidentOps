import { useState } from 'react'
import API from '../services/api'

function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()

    setError('')
    setLoading(true)

    try {
      const response = await API.post('/auth/login', {
        email,
        password
      })

      const token = response.data.access_token

      if (!token) {
        throw new Error('Access token was not received')
      }

      onLogin(token)

    } catch (error) {
      console.error('Login failed:', error)

      const message =
        error.response?.data?.detail ||
        error.message ||
        'Unable to login. Please try again.'

      setError(
        typeof message === 'string'
          ? message
          : 'Invalid login details.'
      )

    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center
      justify-center px-4">

      <div className="w-full max-w-md">

        {/* Branding */}
        <div className="text-center mb-8">

          <div className="mx-auto h-14 w-14 rounded-xl
            bg-blue-600 flex items-center justify-center
            text-2xl font-bold text-white">
            I
          </div>

          <h1 className="text-2xl font-bold text-white mt-4">
            IncidentOps
          </h1>

          <p className="text-slate-400 mt-2 text-sm">
            Enterprise Incident Management Platform
          </p>

        </div>

        {/* Login Card */}
        <div className="bg-slate-900 border border-slate-800
          rounded-xl p-8 shadow-xl">

          <h2 className="text-xl font-semibold text-white">
            Welcome Back
          </h2>

          <p className="text-sm text-slate-400 mt-2 mb-6">
            Sign in to access your workspace.
          </p>

          <form onSubmit={handleSubmit}>

            {/* Email */}
            <div className="mb-5">

              <label className="block text-sm text-slate-300 mb-2">
                Email Address
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@example.com"
                required
                autoComplete="username"
                className="w-full bg-slate-800 border
                  border-slate-700 rounded-lg px-4 py-3
                  text-white placeholder-slate-500
                  outline-none focus:border-blue-500"
              />

            </div>

            {/* Password */}
            <div className="mb-5">

              <label className="block text-sm text-slate-300 mb-2">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                className="w-full bg-slate-800 border
                  border-slate-700 rounded-lg px-4 py-3
                  text-white placeholder-slate-500
                  outline-none focus:border-blue-500"
              />

            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border
                border-red-500/30 text-red-400
                rounded-lg p-3 text-sm mb-5">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500
                disabled:bg-blue-800 disabled:cursor-not-allowed
                text-white font-semibold rounded-lg py-3
                transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

          </form>

        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          Secure Incident Management Workspace
        </p>

      </div>

    </div>
  )
}

export default Login