
    import { useEffect, useState } from 'react'
    import API from '../services/api'

    function Incidents() {
      const [incidents, setIncidents] = useState([])
      const [loading, setLoading] = useState(true)
      const [error, setError] = useState('')
      const [services, setServices] = useState([])

      const [showForm, setShowForm] = useState(false)
      
      const [editingIncident, setEditingIncident] = useState(null)

    const [editFormData, setEditFormData] = useState({
      title: '',
      description: '',
      severity: 'P3',
      status: 'open',
      service_id: ''
    })

    const [updating, setUpdating] = useState(false)

      const [formData, setFormData] = useState({
      title: '',
      description: '',
      severity: 'P3',
      service_id: ''
      })

      const [submitting, setSubmitting] = useState(false)
      const [formError, setFormError] = useState('')

      async function fetchIncidents() {
  setLoading(true)
  setError('')

  try {
    const response = await API.get('/incidents/')

    setIncidents(response.data)

  } catch (error) {
    console.error('Failed to fetch incidents:', error)

    const message = error.response?.data?.detail

    setError(
      typeof message === 'string'
        ? message
        : 'Unable to load incidents. Please try again.'
    )

  } finally {
    setLoading(false)
  }
}
    // Load initial incident and service data
useEffect(() => {
  const controller = new AbortController()

  async function loadInitialIncidents() {
    try {
      const response = await API.get('/incidents/', {
        signal: controller.signal
      })

      if (!controller.signal.aborted) {
        setIncidents(response.data)
      }

    } catch (error) {
      if (controller.signal.aborted) return

      console.error('Failed to fetch incidents:', error)

      const message = error.response?.data?.detail

      setError(
        typeof message === 'string'
          ? message
          : 'Unable to load incidents. Please try again.'
      )

    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
      }
    }
  }

  async function loadInitialServices() {
    try {
      const response = await API.get('/services/', {
        signal: controller.signal
      })

      if (!controller.signal.aborted) {
        setServices(response.data)
      }

    } catch (error) {
      if (controller.signal.aborted) return

      console.error('Failed to fetch services:', error)

      setFormError('Unable to load services.')
    }
  }

  loadInitialIncidents()
  loadInitialServices()

  return () => {
    controller.abort()
  }
}, [])
      
      async function handleCreateIncident(event) {
      event.preventDefault()

      setFormError('')
      setSubmitting(true)

      try {
        const payload = {
          ...formData,
          service_id: Number(formData.service_id)
        }

        await API.post('/incidents/', payload)

        setFormData({
          title: '',
          description: '',
          severity: 'P3',
          service_id: ''
        })

        setShowForm(false)

        await fetchIncidents()

      } catch (error) {
        console.error('Incident creation failed:', error)

        const message = error.response?.data?.detail

        setFormError(
          typeof message === 'string'
            ? message
            : 'Unable to create incident. Please check your input and permissions.'
        )

      } finally {
        setSubmitting(false)
      }
      }

   
    function handleEditIncident(incident) {
      setEditingIncident(incident)

      setEditFormData({
        title: incident.title,
        description: incident.description || '',
        severity: incident.severity,
        status: incident.status,
        service_id: String(incident.service_id)
      })

      setFormError('')
    }


    async function handleUpdateIncident(event) {
      event.preventDefault()

      setFormError('')
      setUpdating(true)

      try {
        const payload = {
          ...editFormData,
          service_id: Number(editFormData.service_id)
        }

        await API.put(
          `/incidents/${editingIncident.id}`,
          payload
        )

        setEditingIncident(null)

        setEditFormData({
          title: '',
          description: '',
          severity: 'P3',
          status: 'open',
          service_id: ''
        })

        await fetchIncidents()

      } catch (error) {
        console.error('Incident update failed:', error)

        const message = error.response?.data?.detail

        setFormError(
          typeof message === 'string'
            ? message
            : 'Unable to update incident. Please check your input and permissions.'
        )

      } finally {
        setUpdating(false)
      }
    }

    

      function getSeverityStyle(severity) {
        const styles = {
          P1: 'bg-red-500/10 text-red-400 border-red-500/30',
          P2: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
          P3: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
          P4: 'bg-blue-500/10 text-blue-400 border-blue-500/30'
        }

        return styles[severity] || 'bg-slate-700 text-slate-300'
      }

      function getStatusStyle(status) {
        const styles = {
          open: 'bg-red-500/10 text-red-400',
          investigating: 'bg-orange-500/10 text-orange-400',
          identified: 'bg-yellow-500/10 text-yellow-400',
          monitoring: 'bg-blue-500/10 text-blue-400',
          resolved: 'bg-green-500/10 text-green-400'
        }

        return styles[status] || 'bg-slate-700 text-slate-300'
      }

      function formatDate(date) {
        if (!date) return '—'

        return new Date(date).toLocaleString()
      }

      return (
        <div className="space-y-6">

          {/* Page Header */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Incidents
              </h1>

              <p className="text-sm text-slate-400 mt-1">
                Monitor and manage service incidents.
              </p>
            </div>

            <div className="flex gap-3">

      <button
      onClick={() => {
  setEditingIncident(null)
  setShowForm(!showForm)
  setFormError('')
}}
        className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm font-medium"
      >
        + Create Incident
      </button>

      <button
        onClick={fetchIncidents}
        disabled={loading}
        className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-medium"
      >
        {loading ? 'Loading...' : 'Refresh'}
      </button>

    </div>
          </div>

          {/* Create Incident Form - Modal */}
{showForm && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">

    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-2xl">

             <div className="flex items-center justify-between mb-5">
  <h2 className="text-lg font-semibold text-white">
    Create New Incident
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

              <form
                onSubmit={handleCreateIncident}
                className="space-y-5"
              >

                {/* Title */}
                <div>
                  <label className="block text-sm text-slate-300 mb-2">
                    Incident Title
                  </label>

                  <input
                    type="text"
                    required
                    minLength={3}
                    maxLength={200}
                    value={formData.title}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        title: event.target.value
                      })
                    }
                    placeholder="Example: Payment API is unavailable"
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
                    maxLength={2000}
                    value={formData.description}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        description: event.target.value
                      })
                    }
                    placeholder="Describe the incident..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white"
                  />
                </div>

                {/* Severity */}
                <div>
                  <label className="block text-sm text-slate-300 mb-2">
                    Severity
                  </label>

                  <select
                    value={formData.severity}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        severity: event.target.value
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white"
                  >
                    <option value="P1">P1 - Critical</option>
                    <option value="P2">P2 - High</option>
                    <option value="P3">P3 - Medium</option>
                    <option value="P4">P4 - Low</option>
                  </select>
                </div>

                {/* Service */}
                <div>
                  <label className="block text-sm text-slate-300 mb-2">
                    Affected Service
                  </label>

                  <select
                    required
                    value={formData.service_id}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        service_id: event.target.value
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white"
                  >
                    <option value="">Select a service</option>

                    {services
                      .filter((service) => service.is_active)
                      .map((service) => (
                        <option
                          key={service.id}
                          value={service.id}
                        >
                          {service.name}
                        </option>
                      ))}
                  </select>
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
                    disabled={
                      submitting ||
                      services.filter(
                        (service) => service.is_active
                      ).length === 0
                    }
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-5 py-2 rounded-lg text-white font-medium"
                  >
                    {submitting ? 'Creating...' : 'Create Incident'}
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

          
          {/* Edit Incident Form - Modal */}
{editingIncident && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">

    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden bg-slate-900 border border-blue-500/30 rounded-xl p-6 shadow-2xl">

             <div className="flex items-center justify-between mb-5">
 <div className="flex items-center justify-between mb-5">
  <h2 className="text-lg font-semibold text-white">
    Edit Incident #{editingIncident.id}
  </h2>

  <button
    type="button"
    onClick={() => {
      setEditingIncident(null)
      setFormError('')
    }}
    className="text-slate-400 hover:text-white text-2xl"
    aria-label="Close"
  >
    ×
  </button>
</div>
</div>

              <form
                onSubmit={handleUpdateIncident}
                className="space-y-5"
              >

                {/* Title */}
                <div>
                  <label className="block text-sm text-slate-300 mb-2">
                    Incident Title
                  </label>

                  <input
                    type="text"
                    required
                    minLength={3}
                    maxLength={200}
                    value={editFormData.title}
                    onChange={(event) =>
                      setEditFormData({
                        ...editFormData,
                        title: event.target.value
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
                    maxLength={2000}
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

                {/* Severity */}
                <div>
                  <label className="block text-sm text-slate-300 mb-2">
                    Severity
                  </label>

                  <select
                    value={editFormData.severity}
                    onChange={(event) =>
                      setEditFormData({
                        ...editFormData,
                        severity: event.target.value
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white"
                  >
                    <option value="P1">P1 - Critical</option>
                    <option value="P2">P2 - High</option>
                    <option value="P3">P3 - Medium</option>
                    <option value="P4">P4 - Low</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm text-slate-300 mb-2">
                    Status
                  </label>

                  <select
                    value={editFormData.status}
                    onChange={(event) =>
                      setEditFormData({
                        ...editFormData,
                        status: event.target.value
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white"
                  >
                    <option value="open">Open</option>
                    <option value="investigating">Investigating</option>
                    <option value="identified">Identified</option>
                    <option value="monitoring">Monitoring</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>

                {/* Service */}
                <div>
                  <label className="block text-sm text-slate-300 mb-2">
                    Affected Service
                  </label>

                  <select
                    required
                    value={editFormData.service_id}
                    onChange={(event) =>
                      setEditFormData({
                        ...editFormData,
                        service_id: event.target.value
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white"
                  >
                    <option value="">Select a service</option>

                    {services
                      .filter((service) => service.is_active)
                      .map((service) => (
                        <option
                          key={service.id}
                          value={service.id}
                        >
                          {service.name}
                        </option>
                      ))}
                  </select>
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
                      setEditingIncident(null)
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


          {/* Incident Count */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <p className="text-sm text-slate-400">
              Total Incidents
            </p>

            <p className="text-3xl font-bold text-white mt-2">
              {incidents.length}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-4">
              {error}
            </div>
          )}

          {/* Incident Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">

            <div className="p-5 border-b border-slate-800">
              <h2 className="text-lg font-semibold text-white">
                Incident Records
              </h2>
            </div>

            {loading ? (
              <div className="p-8 text-center text-slate-400">
                Loading incidents...
              </div>
            ) : incidents.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                No incidents found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">

                  <thead className="bg-slate-800/70 text-slate-400">
                    <tr>
                      <th className="px-5 py-4">ID</th>
                      <th className="px-5 py-4">Title</th>
                      <th className="px-5 py-4">Severity</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4">Service ID</th>
                      <th className="px-5 py-4">Created At</th>
                      <th className="px-5 py-4">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {incidents.map((incident) => (
                      <tr
  key={incident.id}
  onDoubleClick={() => {
    setShowForm(false)
    handleEditIncident(incident)
  }}
  title="Double-click to edit this incident"
  className="border-t border-slate-800 hover:bg-slate-800/40 cursor-pointer"
>
                        <td className="px-5 py-4 text-slate-400">
                          #{incident.id}
                        </td>

                        <td className="px-5 py-4 text-white font-medium">
                          {incident.title}
                        </td>

                        <td className="px-5 py-4">
                          <span className={`px-3 py-1 rounded-full border text-xs font-semibold ${getSeverityStyle(incident.severity)}`}>
                            {incident.severity}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusStyle(incident.status)}`}>
                            {incident.status}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-slate-300">
                          #{incident.service_id}
                        </td>

                        <td className="px-5 py-4 text-slate-400 whitespace-nowrap">
                          {formatDate(incident.created_at)}
                        </td>
                        <td className="px-5 py-4">
  <button
    onClick={() => {
      setShowForm(false)
      handleEditIncident(incident)
    }}
    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
  >
    Edit
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

    export default Incidents
