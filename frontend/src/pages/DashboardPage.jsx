import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

import { API } from '../constants/Api'
import { Icon, Notice, PageHeader } from '../components/UI'
import DashboardCharts from '../components/DashboardCharts'
import useRequest from '../utils/useRequest'
import { money } from '../utils/format'

export default function DashboardPage() {
  const user = useSelector((state) => state.auth.user)
  const { data, loading, error, load } = useRequest('dashboard')
  const [chartRefresh, setChartRefresh] = useState(0)
  const isAdmin = user.role === 'AD'
  const endpoint = isAdmin ? API.dashboard : API.availability

  useEffect(() => {
    const task = load(endpoint)
    return () => task.abort()
  }, [load, endpoint])

  function refreshDashboard() {
    load(endpoint)
    setChartRefresh((current) => current + 1)
  }

  const statistics = isAdmin
    ? [
        {
          title: 'Total spaces',
          value: data?.totalSpaces,
          icon: 'space',
          colour: 'blue',
        },
        {
          title: 'Occupied spaces',
          value: data?.occupiedSpaces,
          icon: 'vehicle',
          colour: 'red',
        },
        {
          title: 'Available spaces',
          value: data?.availableSpaces,
          icon: 'space',
          colour: 'green',
        },
        {
          title: 'Blocked spaces',
          value: data?.blockedSpaces,
          icon: 'space',
          colour: 'grey',
        },
        {
          title: "Today's Daily Entries",
          value: data?.todayDailyVehicles,
          icon: 'entry',
          colour: 'black',
        },
        {
          title: 'Currently parked',
          value: data?.currentlyParkedCount,
          icon: 'vehicle',
          colour: 'black',
        },
        {
          title: "Today's daily revenue",
          value: money(data?.todayDailyRevenue),
          icon: 'rate',
          colour: 'black',
          currency: true,
        },
        {
          title: 'Monthly revenue',
          value: money(data?.monthlyRevenue),
          icon: 'calendar',
          colour: 'black',
          currency: true,
        },
      ]
    : [
        {
          title: 'Total spaces',
          value: data?.counts?.total,
          icon: 'space',
          colour: 'blue',
        },
        {
          title: 'Occupied spaces',
          value: data?.counts?.occupied,
          icon: 'vehicle',
          colour: 'red',
        },
        {
          title: 'Available spaces',
          value: data?.counts?.available,
          icon: 'space',
          colour: 'green',
        },
        {
          title: 'Blocked spaces',
          value: data?.counts?.blocked,
          icon: 'space',
          colour: 'grey',
        },
      ]

  const spaceCounts = isAdmin
    ? {
        total: data?.totalSpaces,
        occupied: data?.occupiedSpaces,
        available: data?.availableSpaces,
        blocked: data?.blockedSpaces,
      }
    : data?.counts

  return (
    <div className="dashboard-page">
      <PageHeader title="Dashboard">
        <button
          className="secondary"
          disabled={loading}
          onClick={refreshDashboard}
        >
          <Icon name="refresh" size={16} />
          Refresh
        </button>
      </PageHeader>

      <section className="welcome-banner">
        <div>
          <span className="story-tag">YOUR PARKING WORKSPACE</span>
          <h2>
            Welcome back, {user.firstName || user.username}.
          </h2>
        </div>
      </section>

      <Notice error={error} />

      <section
        className="summary-grid"
        aria-label="Parking summary"
        aria-busy={loading}
      >
        {statistics.map((item) => (
          <article
            key={item.title}
            className={`summary-card summary-${item.colour}`}
          >
            <span className="summary-watermark" aria-hidden="true">
              <Icon name={item.icon} size={96} />
            </span>
            <span className="summary-title">{item.title}</span>
            <strong
              className={`summary-value ${
                item.currency ? 'summary-currency' : ''
              }`}
            >
              {loading ? '…' : error ? '—' : item.value ?? '—'}
            </strong>
          </article>
        ))}
      </section>

      {isAdmin && data?.monthlyRevenuePeriod && (
        <p className="dashboard-period">
          Monthly revenue period: {data.monthlyRevenuePeriod}
        </p>
      )}

      <DashboardCharts
        counts={spaceCounts}
        loading={loading}
        error={error}
        isAdmin={isAdmin}
        refreshKey={chartRefresh}
      />
    </div>
  )
}