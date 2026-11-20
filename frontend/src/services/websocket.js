
const WS_BASE_URL = 'ws://localhost:8000/ws/incidents'

export function connectIncidentWebSocket(
  token,
  onMessage,
  onStatusChange
) {
  if (!token) {
    throw new Error('Authentication token is required')
  }

  // Establish a WebSocket connection
  const socket = new WebSocket(
    `${WS_BASE_URL}?token=${encodeURIComponent(token)}`
  )

  // Connection established
  socket.onopen = () => {
    console.log('Incident WebSocket connected')
    onStatusChange?.('connected')
  }

  // Receive messages from FastAPI
  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data)

      console.log('WebSocket event received:', message)

      onMessage?.(message)

    } catch (error) {
      console.error('Invalid WebSocket message:', error)
    }
  }

  // Connection error
  socket.onerror = (error) => {
    console.error('WebSocket error:', error)
    onStatusChange?.('error')
  }

  // Connection closed
  socket.onclose = (event) => {
    console.log('WebSocket disconnected:', event.code)
    onStatusChange?.('disconnected')
  }

  // Return socket so React can close it later
  return socket
}
