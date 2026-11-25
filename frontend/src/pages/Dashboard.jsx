import { useEffect, useState } from "react";
import API from "../services/api";
import { useWebSocket } from "../context/useWebSocket";

function Dashboard({ onNavigate }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshVersion, setRefreshVersion] = useState(0);
 const { incidentRevision } = useWebSocket();


  useEffect(() => {
    const controller = new AbortController();

    async function loadDashboard() {
      try {
        const response = await API.get("/dashboard/stats", {
          signal: controller.signal,
        });

        if (!controller.signal.aborted) {
          setDashboardData(response.data);
        }
      } catch (error) {
        if (controller.signal.aborted) return;

        console.error("Failed to load dashboard:", error);

        const message = error.response?.data?.detail;

        setError(
          typeof message === "string"
            ? message
            : "Unable to load dashboard statistics.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      controller.abort();
    };
  }, [refreshVersion, incidentRevision]);

  function refreshDashboard() {
    setLoading(true);
    setError("");
    setRefreshVersion((previous) => previous + 1);
  }

  function formatLastUpdated(timestamp) {
    if (!timestamp) return "Not available";

    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
      return "Not available";
    }

    return date.toLocaleString();
  }

  const summary = dashboardData?.summary;

  const activeIncidents = summary?.open_incidents ?? 0;

  const stats = [
    {
      title: "Total Incidents",
      value: summary?.total_incidents ?? 0,
      description: "All recorded incidents",
      icon: "▦",
      color: "blue",
    },
    {
      title: "Open Incidents",
      value: summary?.open_incidents ?? 0,
      description: "Unresolved incidents",
      icon: "⚠",
      color: "red",
    },
    {
      title: "Resolved Today",
      value: summary?.resolved_today ?? 0,
      description: "Resolved today (UTC)",
      icon: "✓",
      color: "green",
    },
    {
      title: "Active Services",
      value: summary?.active_services ?? 0,
      description: "Enabled services",
      icon: "◈",
      color: "purple",
    },
  ];

  const severityData = [
    {
      severity: "P1 - Critical",
      count: dashboardData?.severity_breakdown?.P1 ?? 0,
      color: "bg-red-500",
    },
    {
      severity: "P2 - High",
      count: dashboardData?.severity_breakdown?.P2 ?? 0,
      color: "bg-orange-500",
    },
    {
      severity: "P3 - Medium",
      count: dashboardData?.severity_breakdown?.P3 ?? 0,
      color: "bg-yellow-500",
    },
    {
      severity: "P4 - Low",
      count: dashboardData?.severity_breakdown?.P4 ?? 0,
      color: "bg-blue-500",
    },
  ];

  const services = dashboardData?.service_health ?? [];

  const recentIncidents = dashboardData?.recent_incidents ?? [];

  const severityStyles = {
    P1: "bg-red-500/10 text-red-400 border-red-500/20",
    P2: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    P3: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    P4: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  };

  const serviceHealthStyles = {
    Operational: {
      dot: "bg-green-500",
      text: "text-green-400",
    },
    Degraded: {
      dot: "bg-yellow-500",
      text: "text-yellow-400",
    },
    "Major Outage": {
      dot: "bg-red-500",
      text: "text-red-400",
    },
    Inactive: {
      dot: "bg-slate-500",
      text: "text-slate-400",
    },
  };

  const statusStyles = {
    open: "bg-red-500/10 text-red-400",
    investigating: "bg-blue-500/10 text-blue-400",
    identified: "bg-purple-500/10 text-purple-400",
    monitoring: "bg-yellow-500/10 text-yellow-400",
    resolved: "bg-green-500/10 text-green-400",
    closed: "bg-slate-500/10 text-slate-400",
  };

  function formatRelativeTime(timestamp) {
    const date = new Date(timestamp);

    const referenceDate = new Date(dashboardData?.generated_at);

    if (Number.isNaN(date.getTime()) || Number.isNaN(referenceDate.getTime())) {
      return "Unknown";
    }

    const seconds = Math.max(
      0,
      Math.floor((referenceDate.getTime() - date.getTime()) / 1000),
    );

    if (seconds < 60) {
      return "Just now";
    }

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) {
      return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
      return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    }

    const days = Math.floor(hours / 24);

    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  if (loading && !dashboardData) {
    return (
      <div className="p-6 text-center text-slate-400">
        Loading dashboard statistics...
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div
        className="bg-red-500/10 border border-red-500/20
        text-red-400 rounded-xl p-5"
      >
        <h2 className="font-semibold mb-2">Unable to load Dashboard</h2>

        <p className="text-sm mb-4">
          {error || "Dashboard data is unavailable."}
        </p>

        <button
          type="button"
          onClick={refreshDashboard}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-slate-800
            text-white hover:bg-slate-700
            disabled:opacity-50 text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  if (loading && !dashboardData) {
    return (
      <div className="p-6 text-center text-slate-400">
        Loading dashboard statistics...
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div
        className="bg-red-500/10 border border-red-500/20
        text-red-400 rounded-xl p-5"
      >
        <h2 className="font-semibold mb-2">Unable to load Dashboard</h2>

        <p className="text-sm mb-4">
          {error || "Dashboard data is unavailable."}
        </p>

        <button
          type="button"
          onClick={refreshDashboard}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-slate-800
            text-white hover:bg-slate-700
            disabled:opacity-50 text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div
        className="flex flex-col sm:flex-row
        sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>

          <p className="text-sm text-slate-400 mt-1">
            Overview of your incident management platform
          </p>
        </div>

        <div className="flex flex-col sm:items-end gap-2">
          <button
            type="button"
            onClick={refreshDashboard}
            disabled={loading}
            className="inline-flex items-center justify-center
      gap-2 px-4 py-2 rounded-lg
      bg-slate-800 border border-slate-700
      text-sm text-white hover:bg-slate-700
      transition-colors disabled:opacity-50
      disabled:cursor-not-allowed"
          >
            <span
              className={`text-lg leading-none ${
                loading ? "animate-spin" : ""
              }`}
            >
              ↻
            </span>

            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <p className="text-xs text-slate-500">
            Last updated: {formatLastUpdated(dashboardData.generated_at)}
          </p>
        </div>
      </div>
      {error && (
        <div
          role="alert"
          className="bg-red-500/10 border border-red-500/20
      text-red-400 rounded-lg p-3 text-sm"
        >
          {error} Showing the last successfully loaded data. Please try
          refreshing again.
        </div>
      )}
      {/* Statistics Cards */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2
        xl:grid-cols-4 gap-4"
      >
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="bg-slate-900 border border-slate-800
              rounded-xl p-5"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">{stat.title}</p>

              <span className="text-xl text-slate-400">{stat.icon}</span>
            </div>

            <h2 className="text-3xl font-bold mt-4 text-white">{stat.value}</h2>

            <p className="text-xs text-slate-500 mt-2">{stat.description}</p>
          </div>
        ))}
      </div>

      {/* Middle Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch w-full">
        {/* Severity Breakdown */}
        <div
          className="bg-slate-900 border border-slate-800
          rounded-xl p-4 min-w-0"
        >
          <h2 className="text-lg font-semibold mb-3">
            Active Incident Severity Breakdown
          </h2>

          <div className="space-y-3">
            {severityData.map((item) => (
              <div key={item.severity}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">{item.severity}</span>

                  <span className="text-white font-medium">{item.count}</span>
                </div>

                <div
                  className="h-1.5 rounded-full
                  bg-slate-800 overflow-hidden"
                >
                  <div
                    className={`${item.color} h-full rounded-full`}
                    style={{
                      width: `${
                        activeIncidents > 0
                          ? (item.count / activeIncidents) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Service Health */}
        <div
          className="bg-slate-900 border border-slate-800
          rounded-xl p-4 min-w-0"
        >
          <h2 className="text-lg font-semibold mb-1">Service Health</h2>

          <p className="text-xs text-slate-500 mb-3">
            Based on recorded incidents
          </p>

          <div className="space-y-2">
            {services.length === 0 && (
              <p className="text-sm text-slate-500 py-4 text-center">
                No services available
              </p>
            )}

            {services.map((service) => (
              <div
                key={service.id}
                className="flex items-center justify-between gap-3
                  border-b border-slate-800 pb-2
                  last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`h-2 w-2 shrink-0 rounded-full
                      ${
                        serviceHealthStyles[service.status]?.dot ??
                        "bg-slate-500"
                      }`}
                  />

                  <span
                    className="text-sm text-slate-300 truncate"
                    title={service.name}
                  >
                    {service.name}
                  </span>
                </div>

                <span
                  className={`text-xs font-medium shrink-0
                    ${
                      serviceHealthStyles[service.status]?.text ??
                      "text-slate-400"
                    }`}
                >
                  {service.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Recent Incidents */}
      <div
        className="bg-slate-900 border border-slate-800
        rounded-xl overflow-hidden"
      >
        <div
          className="p-6 border-b border-slate-800
          flex items-center justify-between"
        >
          <div>
            <h2 className="text-lg font-semibold">Recent Incidents</h2>

            <p className="text-sm text-slate-400 mt-1">
              Latest incidents across all services
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate("Incidents")}
            className="inline-flex items-center gap-2
    text-sm text-blue-400 hover:text-blue-300
    transition-colors"
          >
            View All
            <span aria-hidden="true">→</span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/50 text-slate-400">
              <tr>
                <th className="text-left px-6 py-4 font-medium">Incident</th>

                <th className="text-left px-6 py-4 font-medium">Service</th>

                <th className="text-left px-6 py-4 font-medium">Severity</th>

                <th className="text-left px-6 py-4 font-medium">Status</th>

                <th className="text-left px-6 py-4 font-medium">Created</th>
              </tr>
            </thead>

            <tbody>
              {recentIncidents.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-slate-500"
                  >
                    No incidents recorded yet.
                  </td>
                </tr>
              )}
              {recentIncidents.map((incident) => (
                <tr
                  key={incident.id}
                  className="border-t border-slate-800
                    hover:bg-slate-800/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">
                      {incident.title}
                    </div>

                    <div className="text-xs text-slate-500 mt-1">
                      INC-{incident.id}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-slate-400">
                    {incident.service_name}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-md
                      text-xs font-medium border
                      ${severityStyles[incident.severity]}`}
                    >
                      {incident.severity}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-md
                      text-xs font-medium
                      ${
                        statusStyles[incident.status.toLowerCase()] ??
                        "bg-slate-500/10 text-slate-400"
                      }`}
                    >
                      {incident.status.charAt(0).toUpperCase() +
                        incident.status.slice(1).toLowerCase()}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-slate-500">
                    {formatRelativeTime(incident.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
