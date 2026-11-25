import { useWebSocket } from '../context/useWebSocket'

const statusConfig = {
  connected: {
    label: 'Live',
    container: 'bg-green-500/10 border-green-500/20 text-green-400',
    dot: 'bg-green-400',
    description: 'Real-time updates connected'
  },

  reconnecting: {
    label: 'Reconnecting',
    container: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
    dot: 'bg-yellow-400 animate-pulse',
    description: 'Attempting to restore live connection'
  },

  disconnected: {
    label: 'Disconnected',
    container: 'bg-red-500/10 border-red-500/20 text-red-400',
    dot: 'bg-red-400',
    description: 'Live updates unavailable'
  }
}

function ConnectionStatus() {
  const { connectionStatus } = useWebSocket()

  const status =
    statusConfig[connectionStatus] ??
    statusConfig.disconnected

  return (
    <div
      role="status"
      title={status.description}
      className={`
        inline-flex items-center gap-2
        px-3 py-1.5 rounded-full border
        text-xs font-medium whitespace-nowrap
        ${status.container}
      `}
    >
      <span
        aria-hidden="true"
        className={`
          w-2 h-2 rounded-full
          ${status.dot}
        `}
      />

      <span>{status.label}</span>
    </div>
  )
}

export default ConnectionStatus