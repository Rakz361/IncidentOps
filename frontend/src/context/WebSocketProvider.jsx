import { useEffect, useState } from "react";
import WebSocketContext from "./websocketContext";
import { useAuth } from "./useAuth";
import { createWebSocket } from "../services/websocket";

const INITIAL_RETRY_DELAY = 1000;
const MAX_RETRY_DELAY = 30000;

const HEARTBEAT_INTERVAL = 20000;
const HEARTBEAT_TIMEOUT = 10000;

const AUTH_TIMEOUT = 10000;

export function WebSocketProvider({ children }) {
  const { token, logout } = useAuth();

  const [connectionStatus, setConnectionStatus] = useState("disconnected");

  const [lastMessage, setLastMessage] = useState(null);

  const [incidentRevision, setIncidentRevision] = useState(0);

  useEffect(() => {
    if (!token) return;

    let disposed = false;
    let socket = null;
    let authenticated = false;

    let reconnectTimer = null;
    let heartbeatTimer = null;
    let pongTimer = null;
    let authTimer = null;

    let retryDelay = INITIAL_RETRY_DELAY;

    // Clear authentication timeout
    function clearAuthTimer() {
      clearTimeout(authTimer);
      authTimer = null;
    }

    // Clear heartbeat timers
    function clearHeartbeat() {
      clearInterval(heartbeatTimer);
      clearTimeout(pongTimer);

      heartbeatTimer = null;
      pongTimer = null;
    }

    // Schedule automatic reconnection
    function scheduleReconnect() {
      if (disposed || reconnectTimer !== null) {
        return;
      }

      setConnectionStatus("reconnecting");

      const delay = retryDelay;

      retryDelay = Math.min(retryDelay * 2, MAX_RETRY_DELAY);

      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connect();
      }, delay);
    }

    // Send heartbeat only after authentication
    function sendHeartbeat() {
      if (
        disposed ||
        !authenticated ||
        !socket ||
        socket.readyState !== WebSocket.OPEN
      ) {
        return;
      }

      clearTimeout(pongTimer);

      try {
        socket.send("ping");

        pongTimer = setTimeout(() => {
          console.warn("WebSocket heartbeat timed out");

          socket?.close(4000, "Heartbeat timeout");
        }, HEARTBEAT_TIMEOUT);
      } catch {
        socket?.close();
      }
    }

    // Establish WebSocket connection
    function connect() {
      if (disposed) return;

      authenticated = false;

      try {
        socket = createWebSocket();
      } catch (error) {
        console.error("WebSocket creation failed:", error);

        scheduleReconnect();
        return;
      }

      const currentSocket = socket;

      // Transport connected: authenticate first
      currentSocket.onopen = () => {
        if (disposed || socket !== currentSocket) {
          return;
        }

        setConnectionStatus("reconnecting");

        try {
          currentSocket.send(
            JSON.stringify({
              type: "authenticate",
              token: token,
            }),
          );

          authTimer = setTimeout(() => {
            if (!authenticated) {
              console.warn("WebSocket authentication timed out");

              currentSocket.close(4001, "Authentication timeout");
            }
          }, AUTH_TIMEOUT);
        } catch {
          currentSocket.close();
        }
      };

      // Handle incoming messages
      currentSocket.onmessage = (event) => {
        if (disposed || socket !== currentSocket) {
          return;
        }

        try {
          const message = JSON.parse(event.data);

          // Authentication confirmed by backend
          if (message.event === "authenticated") {
            if (authenticated) return;

            authenticated = true;

            clearAuthTimer();

            retryDelay = INITIAL_RETRY_DELAY;

            setConnectionStatus("connected");

            // Recover missed incident data
            setIncidentRevision((previous) => previous + 1);

            console.log("IncidentOps WebSocket authenticated");

            sendHeartbeat();

            heartbeatTimer = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

            return;
          }

          // Ignore other messages until authenticated
          if (!authenticated) {
            return;
          }

          // Handle heartbeat response
          if (message.event === "pong") {
            clearTimeout(pongTimer);
            pongTimer = null;

            return;
          }

          // Store application event
          setLastMessage(message);

          // Trigger incident data refresh
          if (
            [
              "incident_created",
              "incident_updated",
              "incident_deleted",
            ].includes(message.event)
          ) {
            setIncidentRevision((previous) => previous + 1);
          }

          console.log("WebSocket event:", message.event);
        } catch {
          console.error("Invalid WebSocket message");
        }
      };

      // Handle connection errors
      currentSocket.onerror = () => {
        if (disposed || socket !== currentSocket) {
          return;
        }

        console.warn("WebSocket connection error");
      };

      // Handle connection closure
      currentSocket.onclose = (event) => {
        if (disposed || socket !== currentSocket) return;

        authenticated = false;

        clearAuthTimer();
        clearHeartbeat();

        console.log("WebSocket disconnected:", event.code);

        const invalidSessionReasons = [
          "Invalid or expired session",
          "Session expired or inactive",
        ];

        if (
          event.code === 1008 &&
          invalidSessionReasons.includes(event.reason)
        ) {
          setConnectionStatus("disconnected");

          if (sessionStorage.getItem("access_token") === token) {
            logout();
          }

          return;
        }

        if (event.code === 1008 || event.code === 1009) {
          setConnectionStatus("disconnected");
          return;
        }

        scheduleReconnect();
      };
    }

    connect();

    // Cleanup on logout or component unmount
    return () => {
      disposed = true;
      authenticated = false;

      clearTimeout(reconnectTimer);

      clearAuthTimer();
      clearHeartbeat();

      if (socket) {
        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;

        socket.close();
      }
    };
  }, [token, logout]);

  return (
    <WebSocketContext.Provider
      value={{
        connectionStatus: token ? connectionStatus : "disconnected",

        lastMessage: token ? lastMessage : null,

        incidentRevision,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}
