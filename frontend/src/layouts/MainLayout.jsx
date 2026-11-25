import { useState } from "react";
import ConnectionStatus from "../components/ConnectionStatus";

function MainLayout({ children, activePage, onNavigate, user, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navigation = [
    { name: "Dashboard", icon: "▦" },
    { name: "Incidents", icon: "⚠" },
    { name: "Services", icon: "◈" },
    { name: "Users", icon: "♙" },
  ];

  // Convert database role into a readable label
  const roleLabels = {
    admin: "Administrator",
    incident_commander: "Incident Commander",
    responder: "Responder",
    viewer: "Viewer",
  };

  const userName = user?.full_name || "User";
  const userRole = roleLabels[user?.role] || "User";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 ${
          sidebarOpen ? "w-64" : "w-20"
        } bg-slate-900 border-r border-slate-800 transition-all duration-300`}
      >
        <div className="flex h-16 items-center px-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 font-bold text-white">
              I
            </div>

            {sidebarOpen && (
              <span className="text-lg font-bold tracking-wide">
                IncidentOps
              </span>
            )}
          </div>
        </div>

        <nav className="mt-6 px-3">
          {navigation.map((item) => (
            <button
              key={item.name}
              onClick={() => onNavigate(item.name)}
              title={!sidebarOpen ? item.name : ""}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 mb-2 text-sm transition-colors ${
                activePage === item.name
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <span className="text-lg w-6 text-center">{item.icon}</span>

              {sidebarOpen && <span>{item.name}</span>}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full border-t border-slate-800 p-4">
          {sidebarOpen && (
            <div className="text-xs text-slate-500">
              IncidentOps Platform
              <br />
              Version 1.0
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={`${
          sidebarOpen ? "ml-64" : "ml-20"
        } transition-all duration-300`}
      >
        {/* Header */}
        <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-slate-400 hover:text-white text-xl"
            >
              ☰
            </button>

            <span className="text-sm text-slate-400">
              Enterprise Incident Management
            </span>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-4">
            {/* WebSocket Connection Status */}
            <ConnectionStatus />

            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center font-semibold text-white">
                {userInitial}
              </div>

              <div className="hidden sm:block">
                <p className="text-sm font-medium">{userName}</p>

                <p className="text-xs text-slate-400">{userRole}</p>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={onLogout}
              className="bg-red-600/10 text-red-400 hover:bg-red-600 hover:text-white px-3 py-2 rounded-lg text-sm transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

export default MainLayout;
