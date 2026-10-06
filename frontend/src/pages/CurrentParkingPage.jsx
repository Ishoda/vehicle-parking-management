import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import DashboardLayout from '../components/DashboardLayout'
import { sessionExpired } from '../store/slices/authSlice'
import { getCurrentParking } from '../services/CurrentParkingService'
import '../styles/CurrentParkingPage.css'

export default function CurrentParkingPage() {
  const dispatch = useDispatch()
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadParking() {
      setLoading(true)
      setError('')
      setVehicles([])

      try {
        const data = await getCurrentParking(
          searchTerm,
          controller.signal,
        )

        if (!controller.signal.aborted) {
          setVehicles(data)
        }
      } catch (requestError) {
        if (controller.signal.aborted) return

        if (requestError.response?.status === 401) {
          dispatch(sessionExpired())
        } else {
          setError(
            requestError.response?.data?.message ||
              'Could not load current parking. Please try again.',
          )
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadParking()
    return () => controller.abort()
  }, [dispatch, searchTerm, refreshKey])

  function handleSearch(event) {
    event.preventDefault()
    setSearchTerm(searchInput.trim())
    setRefreshKey((current) => current + 1)
  }

  function clearSearch() {
    setSearchInput('')
    setSearchTerm('')
    setRefreshKey((current) => current + 1)
  }

  return (
    <DashboardLayout>
      <main className="current-parking-page">
        <header>
          <h1>Current parking</h1>
          <p>View vehicles currently parked in the facility.</p>
        </header>

        <form className="current-parking-search" onSubmit={handleSearch}>
          <label htmlFor="parking-search">
            Ticket number or vehicle number
          </label>

          <div className="current-parking-controls">
            <input
              id="parking-search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              maxLength={200}
              placeholder="Enter the complete ticket or vehicle number"
            />

            <button type="submit">Search</button>
            <button type="button" onClick={clearSearch}>
              Clear
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => setRefreshKey((current) => current + 1)}
            >
              Refresh
            </button>
          </div>
        </form>

        {error && <p className="current-parking-error" role="alert">{error}</p>}

        {loading ? (
          <p role="status">Loading current parking...</p>
        ) : !error && (
          <>
            <p role="status">
              {vehicles.length} {searchTerm ? 'matching vehicles' : 'parked vehicles'}
            </p>

            {vehicles.length === 0 ? (
              <p>
                {searchTerm
                  ? 'No currently parked vehicle matches your search.'
                  : 'No vehicles are currently parked.'}
              </p>
            ) : (
              <div className="current-parking-table-wrap">
                <table>
                  <caption className="current-parking-caption">
                    Current parked vehicles
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Ticket</th>
                      <th scope="col">Vehicle</th>
                      <th scope="col">Vehicle type</th>
                      <th scope="col">Parking type</th>
                      <th scope="col">Space</th>
                      <th scope="col">Entry time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.map((vehicle) => (
                      <tr key={vehicle.ticketID}>
                        <td>{vehicle.ticketNumber}</td>
                        <td>{vehicle.vehicleNumber}</td>
                        <td>{vehicle.vehicleType}</td>
                        <td>{vehicle.parkingType}</td>
                        <td>{vehicle.spaceCode}</td>
                        <td>
                          {new Date(vehicle.entryDateTime).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </DashboardLayout>
  )
}