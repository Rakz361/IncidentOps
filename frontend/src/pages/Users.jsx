
import { useEffect, useState } from 'react'
import API from '../services/api'
import { useAuth } from '../context/AuthContext'

function Users() {
  const { user } = useAuth()

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [updatingUserId, setUpdatingUserId] = useState(null)
const [successMessage, setSuccessMessage] = useState('')

  const isAdmin = user?.role === 'admin'

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

  useEffect(() => {
    if (isAdmin) {
      fetchUsers()
    } else {
      setLoading(false)
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

    await fetchUsers()

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

    await fetchUsers()

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

        <button
          onClick={fetchUsers}
          disabled={loading}
          className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-medium"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>

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

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">

        {loading ? (
          <div className="p-8 text-center text-slate-400">
            Loading users...
          </div>
        ) : error ? (
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

                {users.map((userItem) => (
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

    </div>
  )
}

export default Users
