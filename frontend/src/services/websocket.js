import API from './api'

export function createWebSocket() {
  const apiBaseURL = API.defaults.baseURL

  const websocketURL = new URL(
    '/ws/incidents',
    apiBaseURL
  )

  websocketURL.protocol =
    websocketURL.protocol === 'https:'
      ? 'wss:'
      : 'ws:'

  if (
    import.meta.env.PROD &&
    window.location.protocol === 'https:' &&
    websocketURL.protocol !== 'wss:'
  ) {
    throw new Error(
      'Secure WebSocket connection is required'
    )
  }

  return new WebSocket(websocketURL.toString())
}