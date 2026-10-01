import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import {
  LayoutGrid,
  CircleCheck,
  Car,
  Ban,
  RefreshCw,
} from 'lucide-react'
import { getSpaceAvailability } from '../services/SpaceAvailabilityService'
import { sessionExpired } from '../store/slices/authSlice'
import DashboardLayout from '../components/DashboardLayout'
import '../styles/SpaceAvailability.css'

const emptyCounts = {
  total: 0,
  available: 0,
  occupied: 0,
  blocked: 0,
}

const availabilityIcons = {
  total: LayoutGrid,
  available: CircleCheck,
  occupied: Car,
  blocked: Ban,
}

function AvailabilityIcon({ type }) {
  const Icon = availabilityIcons[type]

  return Icon ? <Icon size={23} aria-hidden="true" /> : null
}

export default function SpaceAvailabilityPage() {
  const dispatch = useDispatch()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let active = true
    let timer
    let controller

    async function load() {
      controller = new AbortController()
      setLoading(true)

      let continueRefreshing = true

      try {
        const result = await getSpaceAvailability(controller.signal)

        if (active) {
          setData(result)
          setError('')
        }
      } catch (requestError) {
        if (!active || controller.signal.aborted) return

        const status = requestError.response?.status

        if (status === 401) {
          continueRefreshing = false
          dispatch(sessionExpired())
        } else if (status === 403) {
          continueRefreshing = false
          setError('You do not have permission to view parking availability.')
        } else {
          setError(
            requestError.response?.data?.message ||
              'Could not refresh availability. Check your connection and try again.',
          )
        }
      } finally {
        if (active) {
          setLoading(false)

          if (continueRefreshing) {
            timer = window.setTimeout(load, 15000)
          }
        }
      }
    }

    load()

    return () => {
      active = false
      window.clearTimeout(timer)
      controller?.abort()
    }
  }, [dispatch, refreshKey])

  const spaces = data?.spaces || []
  const counts = data?.counts || emptyCounts

    return (
    <DashboardLayout>
      <main className="dashboard-main space-availability">
        <header className="availability-header">
          <div>
            <p className="dashboard-eyebrow">
              Workspace / Space availability
            </p>
            <h1>Parking space availability</h1>
            <p className="availability-description">
              Monitor active spaces and their current status.
            </p>
          </div>

          <button
            className="availability-refresh"
            type="button"
            disabled={loading}
            onClick={() => setRefreshKey((previous) => previous + 1)}
          >
            <RefreshCw size={18} aria-hidden="true" />
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </header>

        <div className="availability-refresh-info">
          <span>Automatically refreshes every 15 seconds</span>

          {data && (
            <span className="availability-updated">
              Last successful refresh:{' '}
              {new Date(data.fetchedAtUtc).toLocaleString()}
            </span>
          )}
        </div>

        {error && (
          <div role="alert" className="availability-error">
            <p>{error}</p>
            {data && (
              <p>
                These records are from the last successful refresh
                and may be out of date.
              </p>
            )}
          </div>
        )}

        {!data && loading && (
          <p className="availability-loading" role="status">
            Loading parking spaces…
          </p>
        )}

        {data && (
          <>
            <section
              className="availability-counts"
              aria-label="Parking space counts"
            >
              {[
                {
                  type: 'total',
                  label: 'Total spaces',
                  value: counts.total,
                  description: 'Active parking spaces',
                },
                {
                  type: 'available',
                  label: 'Available',
                  value: counts.available,
                  description: 'Ready for vehicle entry',
                },
                {
                  type: 'occupied',
                  label: 'Occupied',
                  value: counts.occupied,
                  description: 'Currently in use',
                },
                {
                  type: 'blocked',
                  label: 'Blocked',
                  value: counts.blocked,
                  description: 'Unavailable for parking',
                },
              ].map((card) => (
                <div
                  key={card.type}
                  className={`availability-stat stat-${card.type}`}
                >
                  <div className="availability-stat-top">
                    <span className="availability-stat-label">
                      {card.label}
                    </span>

                    <span className="availability-stat-icon">
                      <AvailabilityIcon type={card.type} />
                    </span>
                  </div>

                  <strong>{card.value}</strong>
                  <span className="availability-stat-description">
                    {card.description}
                  </span>
                </div>
              ))}
            </section>

            <section
              className="availability-records"
              aria-labelledby="spaces-table-title"
            >
              <div className="availability-table-heading">
                <div>
                  <h2 id="spaces-table-title">Parking spaces</h2>
                  <p>Space details and current availability.</p>
                </div>

                <span className="availability-record-count">
                  {spaces.length} records
                </span>
              </div>

              <div
                className="availability-table-container"
                tabIndex={0}
                role="region"
                aria-label="Parking spaces table"
              >
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Space code</th>
                      <th scope="col">Space name</th>
                      <th scope="col">Vehicle type</th>
                      <th scope="col">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {spaces.map((space) => (
                      <tr key={space.spaceId}>
                        <td>{space.spaceCode}</td>
                        <td>{space.spaceName || '—'}</td>
                        <td>{space.vehicleTypeName}</td>
                        <td>
                          <span
                            className={
                              `space-status status-${space.spaceStatus.toLowerCase()}`
                            }
                          >
                            {space.spaceStatus}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {spaces.length === 0 && (
                      <tr>
                        <td colSpan={4}>
                          No active parking spaces found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        <footer className="dashboard-footer">
          Vehicle Parking Management · Staff workspace
        </footer>
      </main>
    </DashboardLayout>
  )

}