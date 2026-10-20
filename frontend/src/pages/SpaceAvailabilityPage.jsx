import { useEffect, useState } from 'react'
import { Car, ParkingSquare, RefreshCw } from 'lucide-react'

import { API } from '../constants/Api'
import { Notice, PageHeader } from '../components/UI'
import useRequest from '../utils/useRequest'
import { rows } from '../utils/format'

const statuses = {
  AV: 'available',
  AVAILABLE: 'available',
  OC: 'occupied',
  OCCUPIED: 'occupied',
  RE: 'reserved',
  RESERVED: 'reserved',
  B: 'blocked',
  BLOCKED: 'blocked',
}

const statusLabels = {
  available: 'Available',
  occupied: 'Occupied',
  reserved: 'Reserved',
  blocked: 'Blocked',
  unknown: 'Unknown',
}

function getStatus(value) {
  const code = String(value || '').trim().toUpperCase()
  return statuses[code] || 'unknown'
}

export default function SpaceAvailabilityPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [vehicleType, setVehicleType] = useState('')
  const { data, loading, error, load } = useRequest('space-availability')

  useEffect(() => {
    const task = load(API.availability)
    return () => task.abort()
  }, [load])

  const spaces = rows(data?.spaces ?? data)
  const vehicleTypes = [
    ...new Set(spaces.map((space) => space.vehicleTypeName).filter(Boolean)),
  ].sort()

  function getCount(name) {
    const suppliedCount = data?.counts?.[name]

    if (
      suppliedCount !== null &&
      suppliedCount !== undefined &&
      suppliedCount !== ''
    ) {
      const count = Number(suppliedCount)
      if (Number.isFinite(count)) return count
    }

    if (name === 'total') return spaces.length

    return spaces.filter(
      (space) => getStatus(space.spaceStatus) === name,
    ).length
  }

  const counters = [
    { name: 'total', label: 'Total' },
    { name: 'available', label: 'Available' },
    { name: 'occupied', label: 'Occupied' },
    { name: 'reserved', label: 'Reserved' },
    { name: 'blocked', label: 'Blocked' },
  ]

  const searchText = search.trim().toLowerCase()
  const filteredSpaces = spaces.filter((space) => {
    const matchesSearch = [
      space.spaceCode,
      space.spaceName,
      space.vehicleTypeName,
    ].some((value) =>
      String(value || '').toLowerCase().includes(searchText),
    )

    const matchesStatus =
      !status || getStatus(space.spaceStatus) === status
    const matchesVehicleType =
      !vehicleType || space.vehicleTypeName === vehicleType

    return matchesSearch && matchesStatus && matchesVehicleType
  })

  return (
    <div className="availability-page">
      <PageHeader title="Space availability">
        <button
          type="button"
          className="secondary"
          disabled={loading}
          onClick={() => load(API.availability)}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </PageHeader>

      <Notice error={error} />

      <section
        className="availability-counters"
        aria-label="Parking space totals"
        aria-busy={loading}
      >
        {counters.map((counter) => (
          <div
            key={counter.name}
            className={`availability-counter counter-${counter.name}`}
          >
            <span>{counter.label}</span>
            <strong>
              {loading ? '…' : error ? '—' : getCount(counter.name)}
            </strong>
          </div>
        ))}
      </section>

      <section className="parking-board">
        <div className="parking-board-heading">
          <div className="parking-legend">
            {Object.entries(statusLabels)
              .filter(([key]) => key !== 'unknown')
              .map(([key, label]) => (
                <span key={key}>
                  <i
                    className={`parking-dot dot-${key}`}
                    aria-hidden="true"
                  />
                  {label}
                </span>
              ))}
          </div>
        </div>

        <div className="parking-filters">
          <input
            type="search"
            aria-label="Search parking spaces"
            placeholder="Search space code or name..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            aria-label="Filter by vehicle type"
            value={vehicleType}
            onChange={(event) => setVehicleType(event.target.value)}
          >
            <option value="">All vehicle types</option>
            {vehicleTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by space status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">All statuses</option>
            {Object.entries(statusLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="parking-board-empty" role="status">
            Loading parking spaces…
          </div>
        ) : error ? (
          <div className="parking-board-empty">
            Parking spaces could not be loaded. Use Refresh to try again.
          </div>
        ) : filteredSpaces.length === 0 ? (
          <div className="parking-board-empty">
            No parking spaces found.
          </div>
        ) : (
          <div className="parking-space-grid">
            {filteredSpaces.map((space) => {
              const spaceStatus = getStatus(space.spaceStatus)

              return (
                <article
                  key={space.spaceID}
                  className={`parking-bay bay-${spaceStatus}`}
                >
                  <div className="parking-bay-top">
                    <strong>{space.spaceCode || space.spaceID}</strong>
                    <span
                      className={`parking-dot dot-${spaceStatus}`}
                      aria-hidden="true"
                    />
                  </div>

                  <div className="parking-bay-icon">
                    {spaceStatus === 'occupied' ? (
                      <Car
                        size={46}
                        strokeWidth={1.6}
                        aria-hidden="true"
                      />
                    ) : (
                      <ParkingSquare
                        size={42}
                        strokeWidth={1.5}
                        aria-hidden="true"
                      />
                    )}
                  </div>

                  <span className="parking-bay-type">
                    {space.vehicleTypeName || 'Vehicle type unavailable'}
                  </span>
                  <span className="parking-bay-status">
                    {statusLabels[spaceStatus]}
                  </span>

                  {spaceStatus === 'blocked' && space.blockReason && (
                    <p className="parking-bay-reason">
                      {space.blockReason}
                    </p>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}