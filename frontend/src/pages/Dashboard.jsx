function Dashboard() {
  const stats = [
    {
      title: 'Total Incidents',
      value: '24',
      description: 'All recorded incidents',
      icon: '▦',
      color: 'blue'
    },
    {
      title: 'Open Incidents',
      value: '8',
      description: 'Requires attention',
      icon: '⚠',
      color: 'red'
    },
    {
      title: 'Resolved Today',
      value: '12',
      description: 'Successfully resolved',
      icon: '✓',
      color: 'green'
    },
    {
      title: 'Active Services',
      value: '6',
      description: 'Services operational',
      icon: '◈',
      color: 'purple'
    }
  ]

  const recentIncidents = [
    {
      id: 'INC-1001',
      title: 'Payment API high latency',
      service: 'Payment API',
      severity: 'P1',
      status: 'Investigating',
      time: '10 minutes ago'
    },
    {
      id: 'INC-1002',
      title: 'Database connection timeout',
      service: 'Database Service',
      severity: 'P2',
      status: 'Identified',
      time: '35 minutes ago'
    },
    {
      id: 'INC-1003',
      title: 'Authentication service unavailable',
      service: 'Auth Service',
      severity: 'P1',
      status: 'Open',
      time: '1 hour ago'
    },
    {
      id: 'INC-1004',
      title: 'Email notification delay',
      service: 'Notification Service',
      severity: 'P3',
      status: 'Monitoring',
      time: '2 hours ago'
    }
  ]

  const severityData = [
    {
      severity: 'P1 - Critical',
      count: 3,
      color: 'bg-red-500'
    },
    {
      severity: 'P2 - High',
      count: 5,
      color: 'bg-orange-500'
    },
    {
      severity: 'P3 - Medium',
      count: 10,
      color: 'bg-yellow-500'
    },
    {
      severity: 'P4 - Low',
      count: 6,
      color: 'bg-blue-500'
    }
  ]

  const services = [
    {
      name: 'Payment API',
      status: 'Operational'
    },
    {
      name: 'Authentication Service',
      status: 'Operational'
    },
    {
      name: 'Database Service',
      status: 'Operational'
    },
    {
      name: 'Notification Service',
      status: 'Degraded'
    }
  ]

  const severityStyles = {
    P1: 'bg-red-500/10 text-red-400 border-red-500/20',
    P2: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    P3: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    P4: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
  }

  const statusStyles = {
    Open: 'bg-red-500/10 text-red-400',
    Investigating: 'bg-blue-500/10 text-blue-400',
    Identified: 'bg-purple-500/10 text-purple-400',
    Monitoring: 'bg-yellow-500/10 text-yellow-400',
    Resolved: 'bg-green-500/10 text-green-400'
  }

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row
        sm:items-center sm:justify-between gap-4">

        <div>
          <h1 className="text-2xl font-bold text-white">
            Dashboard
          </h1>

          <p className="text-sm text-slate-400 mt-1">
            Overview of your incident management platform
          </p>
        </div>

        <div className="text-sm text-slate-400">
          System Overview
        </div>

      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2
        xl:grid-cols-4 gap-4">

        {stats.map((stat) => (
          <div
            key={stat.title}
            className="bg-slate-900 border border-slate-800
              rounded-xl p-5"
          >

            <div className="flex items-center justify-between">

              <p className="text-sm text-slate-400">
                {stat.title}
              </p>

              <span className="text-xl text-slate-400">
                {stat.icon}
              </span>

            </div>

            <h2 className="text-3xl font-bold mt-4 text-white">
              {stat.value}
            </h2>

            <p className="text-xs text-slate-500 mt-2">
              {stat.description}
            </p>

          </div>
        ))}

      </div>

      {/* Middle Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Severity Breakdown */}
        <div className="bg-slate-900 border border-slate-800
          rounded-xl p-6">

          <h2 className="text-lg font-semibold mb-5">
            Incident Severity Breakdown
          </h2>

          <div className="space-y-5">

            {severityData.map((item) => (
              <div key={item.severity}>

                <div className="flex justify-between
                  text-sm mb-2">

                  <span className="text-slate-300">
                    {item.severity}
                  </span>

                  <span className="text-white font-medium">
                    {item.count}
                  </span>

                </div>

                <div className="h-2 rounded-full
                  bg-slate-800 overflow-hidden">

                  <div
                    className={`${item.color} h-full rounded-full`}
                    style={{
                      width: `${(item.count / 24) * 100}%`
                    }}
                  />

                </div>

              </div>
            ))}

          </div>

        </div>

        {/* Service Health */}
        <div className="bg-slate-900 border border-slate-800
          rounded-xl p-6">

          <h2 className="text-lg font-semibold mb-5">
            Service Health
          </h2>

          <div className="space-y-4">

            {services.map((service) => (
              <div
                key={service.name}
                className="flex items-center justify-between
                  border-b border-slate-800 pb-4 last:border-0
                  last:pb-0"
              >

                <div className="flex items-center gap-3">

                  <div className={`h-2.5 w-2.5 rounded-full
                    ${
                      service.status === 'Operational'
                        ? 'bg-green-500'
                        : 'bg-yellow-500'
                    }`}
                  />

                  <span className="text-sm text-slate-300">
                    {service.name}
                  </span>

                </div>

                <span className={`text-xs font-medium
                  ${
                    service.status === 'Operational'
                      ? 'text-green-400'
                      : 'text-yellow-400'
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
      <div className="bg-slate-900 border border-slate-800
        rounded-xl overflow-hidden">

        <div className="p-6 border-b border-slate-800
          flex items-center justify-between">

          <div>
            <h2 className="text-lg font-semibold">
              Recent Incidents
            </h2>

            <p className="text-sm text-slate-400 mt-1">
              Latest incidents across all services
            </p>
          </div>

          <button className="text-sm text-blue-400
            hover:text-blue-300">
            View All
          </button>

        </div>

        {/* Table */}
        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead className="bg-slate-800/50 text-slate-400">

              <tr>
                <th className="text-left px-6 py-4 font-medium">
                  Incident
                </th>

                <th className="text-left px-6 py-4 font-medium">
                  Service
                </th>

                <th className="text-left px-6 py-4 font-medium">
                  Severity
                </th>

                <th className="text-left px-6 py-4 font-medium">
                  Status
                </th>

                <th className="text-left px-6 py-4 font-medium">
                  Created
                </th>
              </tr>

            </thead>

            <tbody>

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
                      {incident.id}
                    </div>

                  </td>

                  <td className="px-6 py-4 text-slate-400">
                    {incident.service}
                  </td>

                  <td className="px-6 py-4">

                    <span className={`px-2 py-1 rounded-md
                      text-xs font-medium border
                      ${severityStyles[incident.severity]}`}
                    >
                      {incident.severity}
                    </span>

                  </td>

                  <td className="px-6 py-4">

                    <span className={`px-2 py-1 rounded-md
                      text-xs font-medium
                      ${statusStyles[incident.status]}`}
                    >
                      {incident.status}
                    </span>

                  </td>

                  <td className="px-6 py-4 text-slate-500">
                    {incident.time}
                  </td>

                </tr>
              ))}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  )
}

export default Dashboard