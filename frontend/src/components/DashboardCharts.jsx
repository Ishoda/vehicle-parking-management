import { useEffect } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { API } from '../constants/Api'
import useRequest from '../utils/useRequest'
import { money, rows, today } from '../utils/format'

function validCount(value) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const number = Number(value)
  return Number.isInteger(number) && number >= 0 ? number : null
}

function shortDate(value) {
  if (!value) return ''

  const date = new Date(`${String(value).slice(0, 10)}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return String(value)

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
}

function compactAmount(value) {
  return new Intl.NumberFormat('en-LK', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

function OccupancyChart({ counts, loading, error }) {
  const total = validCount(counts?.total)
  const occupied = validCount(counts?.occupied)
  const available = validCount(counts?.available)
  const blocked = validCount(counts?.blocked)

  const valuesPresent = [total, occupied, available, blocked].every(
    (value) => value !== null,
  )
  const countsMatch =
    valuesPresent && occupied + available + blocked === total

  const chartData = [
    { name: 'Occupied', value: occupied, fill: '#c7354b' },
    { name: 'Available', value: available, fill: '#21845b' },
    { name: 'Blocked', value: blocked, fill: '#626873' },
  ]

  const occupancyPercentage =
    countsMatch && total > 0
      ? Math.round((occupied / total) * 100)
      : null

  return (
    <section className="dashboard-chart-card">
      <div className="chart-card-heading">
        <div>
          <h2>Parking occupancy</h2>
          <p>Current use of your parking spaces.</p>
        </div>
        <span className="chart-heading-icon">P</span>
      </div>

      {loading ? (
        <div className="chart-empty" role="status">
          Loading parking statistics…
        </div>
      ) : error ? (
        <div className="chart-empty">
          Parking statistics are unavailable. Use Refresh to try again.
        </div>
      ) : !countsMatch ? (
        <div className="chart-empty">
          A complete, consistent space summary is needed to display this chart.
        </div>
      ) : total === 0 ? (
        <div className="chart-empty">
          No parking spaces have been recorded.
        </div>
      ) : (
        <>
          <div
            className="occupancy-chart"
            role="img"
            aria-label={
              `${occupied} occupied, ${available} available and ` +
              `${blocked} blocked spaces`
            }
          >
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={2}
                  stroke="none"
                  isAnimationActive={false}
                >
                  {chartData.map((item) => (
                    <Cell key={item.name} fill={item.fill} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value} spaces`, name]}
                  contentStyle={{
                    borderRadius: 10,
                    border: '1px solid #e7e7eb',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="occupancy-centre">
              <strong>{occupancyPercentage}%</strong>
              <span>occupied</span>
            </div>
          </div>

          <div className="chart-legend">
            {chartData.map((item) => (
              <div className="chart-legend-item" key={item.name}>
                <span
                  className="legend-dot"
                  style={{ background: item.fill }}
                />
                <span>{item.name}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>

          <p className="chart-footnote">
            Occupancy is measured against all {total} spaces, including
            blocked spaces.
          </p>
        </>
      )}
    </section>
  )
}

function CollectionChart({ refreshKey }) {
  const { data, loading, error, load } = useRequest('dashboard-collections')
  const to = today()
  const startDate = new Date(`${to}T00:00:00Z`)

  startDate.setUTCDate(startDate.getUTCDate() - 6)
  const from = startDate.toISOString().slice(0, 10)

  useEffect(() => {
    const task = load(API.reports.collection, { from, to })
    return () => task.abort()
  }, [load, from, to, refreshKey])

  const records = rows(data)
  const validRecords =
    records.length > 0 &&
    records.every((item) =>
      [item.dailyCollection, item.monthlyCollection].every(
        (value) =>
          value !== null &&
          value !== undefined &&
          value !== '' &&
          Number.isFinite(Number(value)) &&
          Number(value) >= 0,
      ),
    )

  const chartData = validRecords
    ? records
        .map((item) => ({
          date: String(item.date).slice(0, 10),
          dailyCollection: Number(item.dailyCollection),
          monthlyCollection: Number(item.monthlyCollection),
        }))
        .sort((first, second) => first.date.localeCompare(second.date))
    : []

  const totalCollection = chartData.reduce(
    (total, item) =>
      total + item.dailyCollection + item.monthlyCollection,
    0,
  )

  return (
    <section className="dashboard-chart-card">
      <div className="chart-card-heading">
        <div>
          <h2>Daily collections</h2>
          <p>
            {shortDate(from)} – {shortDate(to)}{' · '}LKR
          </p>
        </div>

        {validRecords && !loading && !error && (
          <div className="chart-period-total">
            <span>Period total</span>
            <strong>{money(totalCollection)}</strong>
          </div>
        )}
      </div>

      {loading ? (
        <div className="chart-empty" role="status">
          Loading collection history…
        </div>
      ) : error ? (
        <div className="chart-empty chart-error" role="alert">
          {error}
        </div>
      ) : !validRecords ? (
        <div className="chart-empty">
          Daily collection history is not available yet.
        </div>
      ) : (
        <>
          <div
            className="collection-chart"
            role="img"
            aria-label="Daily and monthly parking payments collected by date"
          >
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart
                data={chartData}
                margin={{ top: 15, right: 8, left: 0, bottom: 0 }}
                barCategoryGap="30%"
              >
                <CartesianGrid
                  stroke="#ededf1"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={shortDate}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#737580', fontSize: 11 }}
                  minTickGap={12}
                />
                <YAxis
                  domain={[0, 'auto']}
                  tickFormatter={compactAmount}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                  tick={{ fill: '#737580', fontSize: 11 }}
                />
                <Tooltip
                  labelFormatter={shortDate}
                  formatter={(value, name) => [money(value), name]}
                  contentStyle={{
                    borderRadius: 10,
                    border: '1px solid #e7e7eb',
                  }}
                  cursor={{ fill: '#f5f5f7' }}
                />
                <Bar
                  dataKey="dailyCollection"
                  name="Daily parking"
                  stackId="collection"
                  fill="#c82432"
                  maxBarSize={38}
                  isAnimationActive={false}
                />
                <Bar
                  dataKey="monthlyCollection"
                  name="Monthly parking"
                  stackId="collection"
                  fill="#24252b"
                  maxBarSize={38}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="collection-legend">
            <span>
              <i className="legend-dot daily-dot" />
              Daily parking
            </span>
            <span>
              <i className="legend-dot monthly-dot" />
              Monthly parking
            </span>
          </div>

          <p className="chart-footnote">
            Payments collected on each date, grouped by parking type.
          </p>
        </>
      )}
    </section>
  )
}

export default function DashboardCharts({
  counts,
  loading,
  error,
  isAdmin,
  refreshKey,
}) {
  return (
    <div
      className={`dashboard-charts ${
        isAdmin ? '' : 'dashboard-charts-operator'
      }`}
    >
      <OccupancyChart counts={counts} loading={loading} error={error} />
      {isAdmin && <CollectionChart refreshKey={refreshKey} />}
    </div>
  )
}