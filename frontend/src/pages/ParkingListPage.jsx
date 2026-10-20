import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { API } from '../constants/Api'
import {
  DataTable,
  Icon,
  Notice,
  PageHeader,
  SearchBar,
  Status,
} from '../components/UI'
import useRequest from '../utils/useRequest'
import { dateTime, rows } from '../utils/format'

export default function ParkingListPage({ availability = false }) {
  const endpoint = availability ? API.availability : API.currentParking
  const { data, loading, error, load } = useRequest(
    availability ? 'availability' : 'current-parking',
  )
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    const task = load(endpoint)
    return () => task.abort()
  }, [load, endpoint])

  const list = availability ? data?.spaces || [] : rows(data)
  const filteredRows = list.filter((row) => {
    const category = availability ? row.spaceStatus : row.parkingType
    const matchesFilter = filter === 'ALL' || category === filter
    const matchesSearch = Object.values(row).some((value) =>
      String(value ?? '').toLowerCase().includes(search.toLowerCase()),
    )

    return matchesFilter && matchesSearch
  })

  const columns = availability
    ? [
        { key: 'spaceCode', label: 'Space' },
        { key: 'spaceName', label: 'Name' },
        { key: 'vehicleTypeName', label: 'Vehicle type' },
        {
          key: 'spaceStatus',
          label: 'Status',
          render: (value) => <Status value={value} />,
        },
      ]
    : [
        { key: 'ticketNumber', label: 'Ticket' },
        { key: 'vehicleNumber', label: 'Vehicle' },
        { key: 'vehicleType', label: 'Vehicle type' },
        {
          key: 'parkingType',
          label: 'Parking type',
          render: (value) => <Status value={value} />,
        },
        { key: 'spaceCode', label: 'Space' },
        {
          key: 'entryDateTime',
          label: 'Entry time',
          render: dateTime,
        },
      ]

  const filters = availability
    ? ['ALL', 'AVAILABLE', 'OCCUPIED', 'BLOCKED']
    : ['ALL', 'DAILY', 'MONTHLY']

  return (
    <>
      <PageHeader
        title={availability ? 'Space availability' : 'Current parking'}
        description={
          availability
            ? ''
            : 'Find vehicles currently parked in the facility.'
        }
      >
        <button
          className="secondary"
          disabled={loading}
          onClick={() => load(endpoint)}
        >
          <Icon name="refresh" size={16} />
          Refresh
        </button>
      </PageHeader>

      <Notice error={error} />

      {availability && (
        <section className="stats-grid">
          {['total', 'available', 'occupied', 'blocked'].map((key) => (
            <article className="stat-card" key={key}>
              <span className="muted capitalize">{key} spaces</span>
              <strong>
                {loading ? '…' : error ? '—' : data?.counts?.[key] ?? '—'}
              </strong>
            </article>
          ))}
        </section>
      )}

      {data?.fetchedAtUtc && (
        <p className="muted small">
          Last refreshed: {dateTime(data.fetchedAtUtc)}
        </p>
      )}

      <section className="panel">
        <SearchBar
          onSearch={setSearch}
          placeholder={
            availability
              ? 'Search spaces or vehicle types…'
              : 'Search ticket, vehicle, customer or mobile…'
          }
        >
          <label>
            <span className="sr-only">Filter records</span>
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              {filters.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
        </SearchBar>

        <DataTable
          columns={columns}
          data={filteredRows}
          loading={loading}
          failed={Boolean(error)}
          rowKey={availability ? 'spaceId' : 'ticketID'}
          actions={
            availability
              ? undefined
              : (row) => (
                  <Link
                    className="small-button"
                    to={`/vehicle-exit?ticket=${encodeURIComponent(row.ticketNumber)}`}
                  >
                    Process exit
                  </Link>
                )
          }
        />
      </section>
    </>
  )
}