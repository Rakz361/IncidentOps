import { useEffect, useState } from 'react'
import API from '../services/api'

function AcceptInvitation() {
  const [token] = useState(() => {
  // Read token from URL fragment
  const fragmentParams = new URLSearchParams(
    window.location.hash.slice(1)
  )

  const fragmentToken = fragmentParams.get('token')

  // Support previously generated invitation links
  const queryParams = new URLSearchParams(
    window.location.search
  )

  const queryToken = queryParams.get('token')

  return fragmentToken || queryToken || ''
})

  const [invitation, setInvitation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [error, setError] = useState('')
  const [verificationError, setVerificationError] = useState('')
  const [success, setSuccess] = useState(false)

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Verify invitation when the page opens
  useEffect(() => {
    let cancelled = false

    async function verifyInvitation() {
      if (!token) {
        setVerificationError('Invalid or missing invitation link.')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setVerificationError('')

        const response = await API.post('/invitations/verify', {
          token
        })

        if (!cancelled) {
          setInvitation(response.data)
        }

      } catch (err) {
        const message = err.response?.data?.detail

        if (!cancelled) {
          setVerificationError(
            typeof message === 'string'
              ? message
              : 'Unable to verify this invitation.'
          )
        }

      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    verifyInvitation()

    return () => {
      cancelled = true
    }
  }, [token])

  // Remove the sensitive token from the visible URL
  useEffect(() => {
    if (token) {
      window.history.replaceState(
        null,
        '',
        window.location.pathname
      )
    }
  }, [token])

  async function handleAcceptInvitation(event) {
    event.preventDefault()

    if (submitting || success) return

    setError('')

    if (password.length < 8) {
      setError('Password must contain at least 8 characters.')
      return
    }

    if (password.length > 128) {
      setError('Password cannot exceed 128 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    try {
      setSubmitting(true)

      await API.post('/invitations/accept', {
        token,
        password
      })

      setPassword('')
      setConfirmPassword('')
      setSuccess(true)

    } catch (err) {
      const message = err.response?.data?.detail

      setError(
        typeof message === 'string'
          ? message
          : Array.isArray(message)
            ? message.map(item => item.msg).join(', ')
            : 'Unable to activate your account.'
      )

    } finally {
      setSubmitting(false)
    }
  }

  function goToLogin() {
    window.location.replace('/')
  }

  function formatRole(role) {
    return role
      .split('_')
      .map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
      )
      .join(' ')
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">

      <div className="w-full max-w-md">

        {/* Application Branding */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white">
            IncidentOps
          </h1>

          <p className="text-sm text-slate-400 mt-2">
            Enterprise Incident Management Platform
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl p-6">

          {/* Loading State */}
          {loading ? (
            <div className="text-center py-8">

              <div className="w-8 h-8 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />

              <p className="text-slate-400">
                Verifying your invitation...
              </p>

            </div>

          ) : verificationError ? (

            /* Invalid Invitation */
            <div className="text-center space-y-4">

              <div className="w-14 h-14 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto text-2xl">
                !
              </div>

              <h2 className="text-xl font-bold text-white">
                Invitation Unavailable
              </h2>

              <p className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 text-sm">
                {verificationError}
              </p>

              <p className="text-sm text-slate-400">
                Please contact your administrator if you need a new invitation.
              </p>

              <button
                onClick={goToLogin}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-3 font-medium"
              >
                Back to Sign In
              </button>

            </div>

          ) : success ? (

            /* Successful Account Activation */
            <div className="text-center space-y-4">

              <div className="w-14 h-14 rounded-full bg-green-500/10 text-green-400 flex items-center justify-center mx-auto text-2xl">
                ✓
              </div>

              <h2 className="text-xl font-bold text-white">
                Account Activated
              </h2>

              <p className="text-sm text-green-400">
                Your account has been created successfully.
              </p>

              <p className="text-sm text-slate-400">
                You can now sign in using your email and new password.
              </p>

              <button
                onClick={goToLogin}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-3 font-medium"
              >
                Continue to Sign In
              </button>

            </div>

          ) : invitation && (

            /* Password Setup Form */
            <>

              <h2 className="text-xl font-bold text-white">
                Activate Your Account
              </h2>

              <p className="text-sm text-slate-400 mt-2 mb-5">
                You've been invited to join IncidentOps.
                Set your password to get started.
              </p>

              {/* Invitation Details */}
              <div className="bg-slate-800/70 border border-slate-700 rounded-lg p-4 mb-5 space-y-2">

                <p className="font-semibold text-white">
                  {invitation.full_name}
                </p>

                <p className="text-sm text-slate-400 break-all">
                  {invitation.email}
                </p>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-slate-400">
                    Assigned Role
                  </span>

                  <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-xs font-medium">
                    {formatRole(invitation.role)}
                  </span>
                </div>

              </div>

              {/* Form Error */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 text-sm mb-4">
                  {error}
                </div>
              )}

              <form
                onSubmit={handleAcceptInvitation}
                className="space-y-4"
              >

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm text-slate-300 mb-2">
                    Password
                  </label>

                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={event => setPassword(event.target.value)}
                      required
                      minLength={8}
                      maxLength={128}
                      autoComplete="new-password"
                      disabled={submitting}
                      placeholder="Enter your password"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-4 pr-16 py-3 text-white text-sm focus:outline-none focus:border-blue-500"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>

                  <p className="text-xs text-slate-500 mt-1">
                    Minimum 8 characters
                  </p>

                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm text-slate-300 mb-2">
                    Confirm Password
                  </label>

                  <div className="relative">

                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={event => setConfirmPassword(event.target.value)}
                      required
                      minLength={8}
                      maxLength={128}
                      autoComplete="new-password"
                      disabled={submitting}
                      placeholder="Confirm your password"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-4 pr-16 py-3 text-white text-sm focus:outline-none focus:border-blue-500"
                    />

                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                    >
                      {showConfirmPassword ? 'Hide' : 'Show'}
                    </button>

                  </div>

                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium"
                >
                  {submitting
                    ? 'Activating Account...'
                    : 'Activate Account'}
                </button>

              </form>

              {/* Expiration Information */}
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 mt-5">

                <p className="text-xs text-amber-400">
                  Invitation expires on:
                </p>

                <p className="text-xs text-slate-300 mt-1">
                  {new Date(invitation.expires_at).toLocaleString()}
                </p>

              </div>

              <div className="border-t border-slate-800 mt-5 pt-4 text-center">

                <button
                  type="button"
                  onClick={goToLogin}
                  disabled={submitting}
                  className="text-sm text-blue-400 hover:text-blue-300 disabled:opacity-50"
                >
                  Back to Sign In
                </button>

              </div>

            </>

          )}

        </div>

      </div>

    </div>
  )
}

export default AcceptInvitation