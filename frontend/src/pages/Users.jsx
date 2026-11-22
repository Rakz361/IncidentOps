
import { useEffect, useState } from 'react'
import API from '../services/api'
import { useAuth } from '../context/useAuth'

function Users() {
  const { user } = useAuth()

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const [updatingUserId, setUpdatingUserId] = useState(null)
const [successMessage, setSuccessMessage] = useState('')
  
  // Invite User Modal
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [invitingUser, setInvitingUser] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [invitation, setInvitation] = useState(null)
  const [copied, setCopied] = useState(false)
  const [newUser, setNewUser] = useState({
    full_name: '', email: '', role: 'viewer'
  })

  const isAdmin = user?.role === 'admin'

  const filteredUsers = users.filter((userItem) => {
  const search = searchTerm.toLowerCase().trim()

  return (
    userItem.full_name.toLowerCase().includes(search) ||
    userItem.email.toLowerCase().includes(search)
  )
})

  async function fetchUsers() {
    try {
      setLoading(true)
      setError('')

      const response = await API.get('/admin/users')

      setUsers(response.data)

    } catch (error) {
      console.error('Failed to fetch users:', error)

      const message = error.response?.data?.detail

      setError(
        typeof message === 'string'
          ? message
          : 'Unable to load users.'
      )

    } finally {
      setLoading(false)
    }
  }
  function resetInvitation() {
    setInviteError('')
    setInvitation(null)
    setCopied(false)
    setNewUser({ full_name: '', email: '', role: 'viewer' })
  }

  function openInviteModal() {
    resetInvitation()
    setSuccessMessage('')
    setShowInviteModal(true)
  }

  function closeInviteModal() {
    if (invitingUser) return
    setShowInviteModal(false)
    resetInvitation()
  }

  async function handleInviteUser(event) {
    event.preventDefault()
    if (invitingUser || invitation) return
    setInviteError('')
    if (newUser.full_name.trim().length < 2) {
      setInviteError('Full name must contain at least 2 characters.')
      return
    }
    setInvitingUser(true)
    try {
      const response = await API.post('/admin/invitations', {
        full_name: newUser.full_name.trim(),
        email: newUser.email.trim(),
        role: newUser.role
      })
      setInvitation(response.data)
    } catch (error) {
      const message = error.response?.data?.detail
      setInviteError(typeof message === 'string' ? message :
        Array.isArray(message) ? message.map(item => item.msg).join(', ') :
        'Unable to generate invitation. Please try again.')
    } finally {
      setInvitingUser(false)
    }
  }

  async function copyInvitationLink() {
    setInviteError('')
    setCopied(false)
    try {
      await navigator.clipboard.writeText(invitation.invitation_url)
      setCopied(true)
    } catch {
      setInviteError('Unable to copy automatically. Select and copy the link manually.')
    }
  }

  // Load registered users for administrators
useEffect(() => {
  if (!isAdmin) return

  const controller = new AbortController()

  async function loadInitialUsers() {
    try {
      const response = await API.get('/admin/users', {
        signal: controller.signal
      })

      if (!controller.signal.aborted) {
        setUsers(response.data)
      }

    } catch (error) {
      if (controller.signal.aborted) return

      console.error('Failed to fetch users:', error)

      const message = error.response?.data?.detail

      setError(
        typeof message === 'string'
          ? message
          : 'Unable to load users.'
      )

    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
      }
    }
  }

  loadInitialUsers()

  return () => {
    controller.abort()
  }
}, [isAdmin])

async function handleRoleChange(userItem, newRole) {
  if (userItem.role === newRole) {
    return
  }

  const confirmed = window.confirm(
    `Change ${userItem.full_name}'s role from ${userItem.role} to ${newRole}?`
  )

  if (!confirmed) {
    return
  }

  setError('')
  setSuccessMessage('')
  setUpdatingUserId(userItem.id)

  try {
    await API.put(`/admin/users/${userItem.id}/role`, {
      role: newRole
    })

    setSuccessMessage(
      `${userItem.full_name}'s role was updated successfully.`
    )

    await fetchUsers()

  } catch (error) {
    console.error('Role update failed:', error)

    const message = error.response?.data?.detail

    setError(
      typeof message === 'string'
        ? message
        : 'Unable to update user role.'
    )


  } finally {
    setUpdatingUserId(null)
  }
}
async function handleStatusChange(userItem) {
  const newStatus = !userItem.is_active

  const action = newStatus ? 'activate' : 'deactivate'

  const confirmed = window.confirm(
    `Are you sure you want to ${action} ${userItem.full_name}'s account?`
  )

  if (!confirmed) {
    return
  }

  setError('')
  setSuccessMessage('')
  setUpdatingUserId(userItem.id)

  try {
    await API.put(`/admin/users/${userItem.id}/status`, {
      is_active: newStatus
    })

    setSuccessMessage(
      `${userItem.full_name}'s account was ${newStatus ? 'activated' : 'deactivated'} successfully.`
    )

    await fetchUsers()

  } catch (error) {
    console.error('User status update failed:', error)

    const message = error.response?.data?.detail

    setError(
      typeof message === 'string'
        ? message
        : 'Unable to update user status.'
    )

    

  } finally {
    setUpdatingUserId(null)
  }
}
  if (!isAdmin) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-red-400">
          Access Denied
        </h2>
        <p className="text-slate-400 mt-2">
          Only administrators can manage users.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex items-center justify-between">

        <div>
          <h1 className="text-2xl font-bold text-white">
            User Management
          </h1>

          <p className="text-sm text-slate-400 mt-1">
            Manage users, roles and account access.
          </p>
        </div>

       <div className="flex items-center gap-3">

  <button
   onClick={openInviteModal}
    className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm font-medium text-white"
  >
    + Invite User
  </button>

  <button
    onClick={fetchUsers}
    disabled={loading}
    className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-medium"
  >
    {loading ? 'Loading...' : 'Refresh'}
  </button>

</div>

      </div>

      {/* User Count */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <p className="text-sm text-slate-400">
          Total Registered Users
        </p>

        <p className="text-3xl font-bold text-white mt-2">
          {users.length}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-4">
          {error}
        </div>
      )}

      {successMessage && (
  <div className="bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg p-4">
    {successMessage}
  </div>
)}
{/* Search Users */}
<div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
  <input
    type="text"
    placeholder="Search users by name or email..."
    value={searchTerm}
    onChange={(event) => setSearchTerm(event.target.value)}
    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
  />
  <p className="text-xs text-slate-400 mt-3">
  Showing {filteredUsers.length} of {users.length} users
</p>
</div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">

        {loading ? (
          <div className="p-8 text-center text-slate-400">
            Loading users...
          </div>
        ) : error && users.length === 0 ? (
  <div className="p-8 text-center text-slate-400">
    Unable to display users.
  </div>
) : users.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No registered users found.
          </div>
        ) : (

          <div className="overflow-x-auto">

            <table className="w-full text-left">

              <thead className="bg-slate-800/70 text-slate-400 text-sm">
                <tr>
                  <th className="px-5 py-4">ID</th>
                  <th className="px-5 py-4">Full Name</th>
                  <th className="px-5 py-4">Email</th>
                  <th className="px-5 py-4">Role</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>

              <tbody>

                {filteredUsers.length === 0 && (
  <tr>
    <td
      colSpan="6"
      className="px-5 py-8 text-center text-slate-400"
    >
      No users match your search.
    </td>
  </tr>
)}

{filteredUsers.map((userItem) => (
                  <tr
                    key={userItem.id}
                    className="border-t border-slate-800 hover:bg-slate-800/40"
                  >

                    <td className="px-5 py-4 text-slate-400">
                      #{userItem.id}
                    </td>

                    <td className="px-5 py-4 text-white font-medium">
                      {userItem.full_name}
                    </td>

                    <td className="px-5 py-4 text-slate-300">
                      {userItem.email}
                    </td>

                    <td className="px-5 py-4">
  <select
    value={userItem.role}
    disabled={
      updatingUserId === userItem.id ||
      userItem.id === user.id
    }
    onChange={(event) =>
      handleRoleChange(userItem, event.target.value)
    }
    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <option value="admin">Admin</option>
    <option value="incident_commander">
      Incident Commander
    </option>
    <option value="responder">Responder</option>
    <option value="viewer">Viewer</option>
  </select>
</td>

                    <td className="px-5 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          userItem.is_active
                            ? 'bg-green-500/10 text-green-400'
                            : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {userItem.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
<td className="px-5 py-4">
  <button
    onClick={() => handleStatusChange(userItem)}
    disabled={
      updatingUserId === userItem.id ||
      userItem.id === user.id
    }
    className={`px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
      userItem.is_active
        ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
        : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
    }`}
  >
    {userItem.is_active ? 'Deactivate' : 'Activate'}
  </button>
</td>
                  </tr>
                ))}

              </tbody>

            </table>

          </div>
        )}

      </div>

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="invite-title" className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-xl shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <div>
                <h2 id="invite-title" className="text-xl font-bold text-white">
                  {invitation ? 'Invitation Created' : 'Invite New User'}
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  {invitation ? 'Share the link privately with the invited user.' : 'Invite a new user to IncidentOps.'}
                </p>
              </div>
              <button type="button" aria-label="Close invitation modal" onClick={closeInviteModal} disabled={invitingUser} className="text-slate-400 hover:text-white text-2xl disabled:opacity-50">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              {inviteError && (
                <div role="alert" className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 text-sm">{inviteError}</div>
              )}
              {invitation ? (
                <div className="space-y-4">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-green-400 text-sm">Invitation generated successfully.</div>
                  <div className="bg-slate-800 rounded-lg p-4 text-sm space-y-1">
                    <p className="text-white font-medium">{invitation.full_name}</p>
                    <p className="text-slate-300 break-all">{invitation.email}</p>
                    <p className="text-slate-400 capitalize">Role: {invitation.role.replaceAll('_', ' ')}</p>
                  </div>
                  <label className="block text-sm text-slate-300" htmlFor="invitation-link">Invitation Link</label>
                  <input id="invitation-link" readOnly value={invitation.invitation_url} onFocus={(event) => event.target.select()} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white" />
                  <button type="button" onClick={copyInvitationLink} className="w-full bg-blue-600 hover:bg-blue-500 rounded-lg px-4 py-3 text-sm font-medium text-white">{copied ? 'Copied!' : 'Copy Invitation Link'}</button>
                  <p className="text-xs text-amber-400">Expires: {new Date(invitation.expires_at).toLocaleString()}</p>
                  <p className="text-xs text-slate-400">Anyone with this link can redeem it. Share it privately and copy it before closing.</p>
                  <button type="button" onClick={closeInviteModal} className="w-full bg-slate-700 hover:bg-slate-600 rounded-lg px-4 py-2 text-sm text-white">Done</button>
                </div>
              ) : (
                <form onSubmit={handleInviteUser} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-sm text-slate-300 mb-2">
            Full Name
          </label>

          <input
            type="text"
            required
            disabled={invitingUser}
            minLength={2}
            maxLength={100}
            value={newUser.full_name}
            onChange={(event) =>
              setNewUser({
                ...newUser,
                full_name: event.target.value
              })
            }
            placeholder="Enter full name"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm text-slate-300 mb-2">
            Email Address
          </label>

          <input
            type="email"
            required
            disabled={invitingUser}
            value={newUser.email}
            onChange={(event) =>
              setNewUser({
                ...newUser,
                email: event.target.value
              })
            }
            placeholder="user@example.com"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Role */}
        <div>
          <label className="block text-sm text-slate-300 mb-2">
            User Role
          </label>

          <select
            disabled={invitingUser}
            value={newUser.role}
            onChange={(event) =>
              setNewUser({
                ...newUser,
                role: event.target.value
              })
            }
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            <option value="viewer">Viewer</option>
            <option value="responder">Responder</option>
            <option value="incident_commander">
              Incident Commander
            </option>
            <option value="admin">Admin</option>
          </select>
        </div>

                  <p className="bg-blue-500/10 text-blue-300 rounded-lg p-3 text-xs">The invited user will set their own password. The invitation expires after 24 hours.</p>
                  <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                    <button type="button" onClick={closeInviteModal} disabled={invitingUser} className="px-4 py-2 rounded-lg text-sm text-slate-300 bg-slate-700 hover:bg-slate-600 disabled:opacity-50">Cancel</button>
                    <button type="submit" disabled={invitingUser} className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50">{invitingUser ? 'Generating...' : 'Generate Invitation'}</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Users
