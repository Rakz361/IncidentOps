
import { useEffect, useState } from 'react'
import API from '../services/api'
import { useAuth } from '../context/AuthContext'

function Services() {
    const { user } = useAuth()

const isAdmin = user?.role === 'admin'

const [showForm, setShowForm] = useState(false)

const [formData, setFormData] = useState({
  name: '',
  description: ''
})

const [submitting, setSubmitting] = useState(false)
const [formError, setFormError] = useState('')
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingService, setEditingService] = useState(null)

const [editFormData, setEditFormData] = useState({
  name: '',
  description: ''
})

const [updating, setUpdating] = useState(false)

  async function fetchServices() {
    try {
      setLoading(true)
      setError('')

      const response = await API.get('/services/')

      setServices(response.data)

    } catch (error) {
      console.error('Failed to fetch services:', error)

      const message = error.response?.data?.detail

      setError(
        typeof message === 'string'
          ? message
          : 'Unable to load services. Please try again.'
      )

    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    fetchServices()
  }, [])

  async function handleCreateService(event) {
  event.preventDefault()

  setFormError('')
  setSubmitting(true)

  try {
    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim() || null
    }

    await API.post('/services/', payload)

    setFormData({
      name: '',
      description: ''
    })

    setShowForm(false)

    await fetchServices()

  } catch (error) {
    console.error('Service creation failed:', error)

    const message = error.response?.data?.detail

    setFormError(
      typeof message === 'string'
        ? message
        : 'Unable to create service. Please check your input and permissions.'
    )

  } finally {
    setSubmitting(false)
  }
}
function handleEditService(service) {
  setEditingService(service)

  setEditFormData({
    name: service.name,
    description: service.description || ''
  })

  setFormError('')
}


async function handleUpdateService(event) {
  event.preventDefault()

  setFormError('')
  setUpdating(true)

  try {
    const payload = {
      name: editFormData.name.trim(),
      description: editFormData.description.trim() || null
    }

    await API.put(
      `/services/${editingService.id}`,
      payload
    )

    setEditingService(null)

    setEditFormData({
      name: '',
      description: ''
    })

    await fetchServices()

  } catch (error) {
    console.error('Service update failed:', error)

    const message = error.response?.data?.detail

    setFormError(
      typeof message === 'string'
        ? message
        : 'Unable to update service. Please check your input and permissions.'
    )

  } finally {
    setUpdating(false)
  }
}

async function handleToggleServiceStatus(service) {
  const action = service.is_active ? 'deactivate' : 'activate'

  const confirmed = window.confirm(
    `Are you sure you want to ${action} "${service.name}"?`
  )

  if (!confirmed) {
    return
  }

  try {
    await API.put(`/services/${service.id}`, {
      is_active: !service.is_active
    })

    await fetchServices()

  } catch (error) {
    console.error('Service status update failed:', error)

    const message = error.response?.data?.detail

    alert(
      typeof message === 'string'
        ? message
        : 'Unable to update service status.'
    )
  }
}


  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Services
          </h1>

          <p className="text-sm text-slate-400 mt-1">
            Monitor and manage your organization's services.
          </p>
        </div>

        <div className="flex gap-3">

  {isAdmin && (
    <button
      onClick={() => {
        setShowForm(true)
        setFormError('')
      }}
      className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm font-medium"
    >
      + Create Service
    </button>
  )}

  <button
    onClick={fetchServices}
    disabled={loading}
    className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-medium"
  >
    {loading ? 'Loading...' : 'Refresh'}
  </button>

</div>
      </div>

      {/* Create Service Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">

          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-2xl">

            {/* Modal Header */}
            <div className="flex items-center justify-between mb-5">

              <h2 className="text-lg font-semibold text-white">
                Create New Service
              </h2>

              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setFormError('')
                }}
                className="text-slate-400 hover:text-white text-2xl"
                aria-label="Close"
              >
                ×
              </button>

            </div>

            {/* Form */}
            <form
              onSubmit={handleCreateService}
              className="space-y-5"
            >

              {/* Service Name */}
              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  Service Name
                </label>

                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={100}
                  value={formData.name}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      name: event.target.value
                    })
                  }
                  placeholder="Example: Payment Gateway"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  Description
                </label>

                <textarea
                  rows={4}
                  maxLength={500}
                  value={formData.description}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      description: event.target.value
                    })
                  }
                  placeholder="Describe what this service does..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white"
                />
              </div>

              {/* Error */}
              {formError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 text-sm">
                  {formError}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3">

                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-5 py-2 rounded-lg text-white font-medium"
                >
                  {submitting ? 'Creating...' : 'Create Service'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setFormError('')
                  }}
                  className="bg-slate-700 hover:bg-slate-600 px-5 py-2 rounded-lg"
                >
                  Cancel
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {editingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">

          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden bg-slate-900 border border-blue-500/30 rounded-xl p-6 shadow-2xl">

            {/* Modal Header */}
            <div className="flex items-center justify-between mb-5">

              <h2 className="text-lg font-semibold text-white">
                Edit Service #{editingService.id}
              </h2>

              <button
                type="button"
                onClick={() => {
                  setEditingService(null)
                  setFormError('')
                }}
                className="text-slate-400 hover:text-white text-2xl"
                aria-label="Close"
              >
                ×
              </button>

            </div>

            {/* Form */}
            <form
              onSubmit={handleUpdateService}
              className="space-y-5"
            >

              {/* Service Name */}
              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  Service Name
                </label>

                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={100}
                  value={editFormData.name}
                  onChange={(event) =>
                    setEditFormData({
                      ...editFormData,
                      name: event.target.value
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  Description
                </label>

                <textarea
                  rows={4}
                  maxLength={500}
                  value={editFormData.description}
                  onChange={(event) =>
                    setEditFormData({
                      ...editFormData,
                      description: event.target.value
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white"
                />
              </div>

              {/* Error */}
              {formError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 text-sm">
                  {formError}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3">

                <button
                  type="submit"
                  disabled={updating}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-5 py-2 rounded-lg text-white font-medium"
                >
                  {updating ? 'Updating...' : 'Save Changes'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditingService(null)
                    setFormError('')
                  }}
                  className="bg-slate-700 hover:bg-slate-600 px-5 py-2 rounded-lg"
                >
                  Cancel
                </button>

              </div>

            </form>

          </div>
        </div>
      )}


      {/* Service Count */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <p className="text-sm text-slate-400">
          Total Services
        </p>

        <p className="text-3xl font-bold text-white mt-2">
          {services.length}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-4">
          {error}
        </div>
      )}

      {/* Services Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">

        <div className="p-5 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-white">
            Service Records
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400">
            Loading services...
          </div>
        ) : services.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No services found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">

              <thead className="bg-slate-800/70 text-slate-400">
                <tr>
                  <th className="px-5 py-4">ID</th>
                  <th className="px-5 py-4">Service Name</th>
                  <th className="px-5 py-4">Description</th>
                  <th className="px-5 py-4">Status</th>
                  {isAdmin && (
  <th className="px-5 py-4">Actions</th>
)}
                </tr>
              </thead>

              <tbody>
                {services.map((service) => (
                  <tr
  key={service.id}
  onDoubleClick={() => {
    if (isAdmin) {
      setShowForm(false)
      handleEditService(service)
    }
  }}
  title={isAdmin ? "Double-click to edit this service" : ""}
  className={`border-t border-slate-800 hover:bg-slate-800/40 ${
    isAdmin ? 'cursor-pointer' : ''
  }`}
>
                    <td className="px-5 py-4 text-slate-400">
                      #{service.id}
                    </td>

                    <td className="px-5 py-4 text-white font-medium">
                      {service.name}
                    </td>

                    <td className="px-5 py-4 text-slate-300">
                      {service.description || '—'}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          service.is_active
                            ? 'bg-green-500/10 text-green-400'
                            : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {service.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {isAdmin && (
  <td className="px-5 py-4">
    {isAdmin && (
  <td className="px-5 py-4">
    <div className="flex items-center gap-2">

      <button
        onClick={() => {
          setShowForm(false)
          handleEditService(service)
        }}
        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
      >
        Edit
      </button>

      <button
        onClick={() => handleToggleServiceStatus(service)}
        className={`px-4 py-2 rounded-lg text-sm font-medium ${
          service.is_active
            ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
            : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
        }`}
      >
        {service.is_active ? 'Deactivate' : 'Activate'}
      </button>

    </div>
  </td>
)}
  </td>
)}
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


export default Services
