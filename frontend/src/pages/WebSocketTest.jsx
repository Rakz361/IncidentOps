
import { useEffect, useRef, useState } from 'react'
import { connectIncidentWebSocket } from '../services/websocket'

function WebSocketTest() {
  const [token, setToken] = useState('')
  const [status, setStatus] = useState('disconnected')
  const [events, setEvents] = useState([])

  const socketRef = useRef(null)

  function handleConnect() {
    if (!token.trim()) {
      alert('Please enter your JWT token')
      return
    }

    if (
      socketRef.current &&
      socketRef.current.readyState !== WebSocket.CLOSED
    ) {
      alert('A WebSocket connection already exists')
      return
    }

    try {
      const socket = connectIncidentWebSocket(
        token.trim(),
        (message) => {
          setEvents((previousEvents) => [
            message,
            ...previousEvents
          ])
        },
        (newStatus) => {
          setStatus(newStatus)
        }
      )

      socketRef.current = socket
    } catch (error) {
      console.error(error)
      alert(error.message)
    }
  }

  function handleDisconnect() {
    if (socketRef.current) {
      socketRef.current.close()
      socketRef.current = null
    }

    setStatus('disconnected')
  }

  function handlePing() {
  console.log('Ping button clicked')

  console.log('Socket:', socketRef.current)

  console.log(
    'Socket readyState:',
    socketRef.current?.readyState
  )

  if (
    socketRef.current &&
    socketRef.current.readyState === WebSocket.OPEN
  ) {
    console.log('Sending ping to backend...')
    socketRef.current.send('ping')
  } else {
    console.log('WebSocket is not open')
  }
}

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close()
      }
    }
  }, [])

  const statusColor = {
    connected: 'text-green-400',
    disconnected: 'text-gray-400',
    error: 'text-red-400'
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-3xl mx-auto">

        <h1 className="text-3xl font-bold mb-2">
          IncidentOps WebSocket Tester
        </h1>

        <p className="text-slate-400 mb-8">
          Test real-time incident communication.
        </p>

        <div className="bg-slate-900 p-6 rounded-xl mb-6">

          <label className="block mb-2">
            JWT Access Token
          </label>

          <textarea
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="Paste your JWT access token here"
            rows={4}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 mb-4"
          />

          <div className="flex flex-wrap gap-3">

            <button
              onClick={handleConnect}
              disabled={status === 'connected'}
              className="bg-blue-600 px-5 py-2 rounded-lg disabled:opacity-40"
            >
              Connect
            </button>

            <button
              onClick={handleDisconnect}
              className="bg-red-600 px-5 py-2 rounded-lg"
            >
              Disconnect
            </button>

            <button
              onClick={handlePing}
              disabled={status !== 'connected'}
              className="bg-slate-700 px-5 py-2 rounded-lg disabled:opacity-40"
            >
              Send Ping
            </button>

          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl mb-6">

          <h2 className="text-xl font-semibold mb-3">
            Connection Status
          </h2>

          <p className={`font-bold ${statusColor[status] || 'text-white'}`}>
            {status.toUpperCase()}
          </p>

        </div>

        <div className="bg-slate-900 p-6 rounded-xl">

          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              Received Events
            </h2>

            <button
              onClick={() => setEvents([])}
              className="text-sm text-blue-400"
            >
              Clear Events
            </button>
          </div>

          {events.length === 0 ? (
            <p className="text-slate-400">
              No events received yet.
            </p>
          ) : (
            <div className="space-y-3">

              {events.map((event, index) => (
                <pre
                  key={index}
                  className="bg-slate-800 p-4 rounded-lg overflow-x-auto text-sm"
                >
                  {JSON.stringify(event, null, 2)}
                </pre>
              ))}

            </div>
          )}

        </div>

      </div>
    </div>
  )
}

export default WebSocketTest
