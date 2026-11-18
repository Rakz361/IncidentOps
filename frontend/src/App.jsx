
import { useEffect, useState } from 'react'
import API from './services/api'

function App() {
  const [backendStatus, setBackendStatus] = useState('Checking...')
  
  useEffect(() => {
    API.get('/')
      .then((response) => {
        setBackendStatus(response.data.message)
      })
      .catch((error) => {
        console.error('Backend connection failed:', error)
        setBackendStatus('Backend connection failed')
      })
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <div className="text-center p-8">
        <h1 className="text-5xl font-bold text-blue-400 mb-4">
          IncidentOps
        </h1>

        <p className="text-xl text-slate-300 mb-6">
          Incident Management and Response Platform
        </p>

        <div className="inline-block bg-green-500/10 text-green-400 px-5 py-2 rounded-lg border border-green-500/30">
          Frontend is running successfully!
        </div>

        <div className="mt-5 text-slate-300">
          **Backend Status:** {backendStatus}
        </div>
      </div>
    </div>
  )
}

export default App
