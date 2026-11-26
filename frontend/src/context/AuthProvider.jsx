import { useCallback, useEffect, useState } from "react";

import API from "../services/api";
import AuthContext from "./authContext";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const logout = useCallback(() => {
    sessionStorage.removeItem("access_token");

    delete API.defaults.headers.common.Authorization;

    setToken(null);
    setUser(null);
  }, []);
  // Restore the current browser session
  useEffect(() => {
    async function restoreSession() {
      const savedToken = sessionStorage.getItem("access_token");

      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        API.defaults.headers.common.Authorization = `Bearer ${savedToken}`;

        const response = await API.get("/auth/me");

        setToken(savedToken);
        setUser(response.data);
      } catch (error) {
        console.error("Session restoration failed:", error);

        sessionStorage.removeItem("access_token");
        delete API.defaults.headers.common.Authorization;

        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, []);

  // Login
  async function login(newToken) {
    sessionStorage.setItem("access_token", newToken);

    API.defaults.headers.common.Authorization = `Bearer ${newToken}`;

    try {
      const response = await API.get("/auth/me");

      setToken(newToken);
      setUser(response.data);
    } catch (error) {
      sessionStorage.removeItem("access_token");
      delete API.defaults.headers.common.Authorization;

      setToken(null);
      setUser(null);

      throw error;
    }
  }

  // Logout
  useEffect(() => {
    const interceptorId = API.interceptors.response.use(
      (response) => response,

      (error) => {
        const status = error.response?.status;
        const requestURL = error.config?.url || "";

        const publicEndpoints = [
          "/auth/login",
          "/auth/register",
          "/invitations/verify",
          "/invitations/accept",
        ];

        const requestPath = requestURL.split("?")[0].replace(/\/+$/, "");

        const isPublicEndpoint = publicEndpoints.some((endpoint) =>
          requestPath.endsWith(endpoint),
        );

        const currentToken = sessionStorage.getItem("access_token");

        const requestAuthorization =
          error.config?.headers?.get?.("Authorization") ||
          error.config?.headers?.Authorization;

        if (
          status === 401 &&
          !isPublicEndpoint &&
          currentToken &&
          requestAuthorization === `Bearer ${currentToken}`
        ) {
          logout();
        }

        return Promise.reject(error);
      },
    );

    return () => {
      API.interceptors.response.eject(interceptorId);
    };
  }, [logout]);
  
  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
