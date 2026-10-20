import { useState } from 'react'

import { API } from '../constants/Api'
import { DataTable, Notice, PageHeader, Status } from '../components/UI'
import useRequest from '../utils/useRequest'
import { dateOnly, dateTime, money, rows, today } from '../utils/format'

const reportDefinitions = {
  collection: {
    title: 'Daily collection',
    columns: [
      { key: 'date', label: 'Date', render: dateOnly },
      {
        key: 'dailyCollection',
        label: 'Daily parking collection',
        render: money,
      },
      {
        key: 'monthlyCollection',
        label: 'Monthly collection',
        render: money,
      },
      { key: 'total', label: 'Total', render: money },
    ],
  },

  vehicles: {
    title: 'Vehicle report',
    columns: [
      { key: 'vehicleNumber', label: 'Vehicle' },
      { key: 'parkingType', label: 'Type' },
      { key: 'entryDateTime', label: 'Entry', render: dateTime },
      { key: 'exitDateTime', label: 'Exit', render: dateTime },
      { key: 'amount', label: 'Amount', render: money },
    ],
  },

  monthly: {
    title: 'Monthly customer report',
    columns: [
      { key: 'customerName', label: 'Customer' },
      { key: 'vehicleNumber', label: 'Vehicle' },
      { key: 'monthlyFee', label: 'Monthly fee', render: money },
      { key: 'startDate', label: 'Valid from', render: dateOnly },
      { key: 'endDate', label: 'Valid to', render: dateOnly },
      {
        key: 'paymentStatus',
        label: 'Payment status',
        render: (value) => <Status value={value} />,
      },
    ],
  },
}

export default function ReportsPage() {
  const [type, setType] = useState('collection')
  const [filters, setFilters] = useState({
    from: today(),
    to: today(),
  })
  const [validation, setValidation] = useState('')
  const request = useRequest(`report:${type}`)
  const definition = reportDefinitions[type]

  function generateReport(event) {
    event.preventDefault()
    setValidation('')

    if (filters.from > filters.to) {
      setValidation('From date must not be after To date.')
      return
    }

    request.load(API.reports[type], filters)
  }

  return (
    <>
      <PageHeader title="Reports" />

      <div className="master-tabs" role="group" aria-label="Report type">
        {Object.entries(reportDefinitions).map(([key, report]) => (
          <button
            key={key}
            type="button"
            className={`master-tab ${type === key ? 'active' : ''}`}
            aria-pressed={type === key}
            onClick={() => {
              setType(key)
              setValidation('')
            }}
          >
            {report.title}
          </button>
        ))}
      </div>

      <section className="panel">
        <form className="filter-grid" onSubmit={generateReport}>
          {['from', 'to'].map((name) => (
            <label className="field" key={name}>
              <span>{name === 'from' ? 'From date' : 'To date'}</span>
              <input
                type="date"
                value={filters[name]}
                required
                onChange={(event) =>
                  setFilters({ ...filters, [name]: event.target.value })
                }
              />
            </label>
          ))}

          <button className="primary" disabled={request.loading}>
            {request.loading ? 'Generating…' : 'Generate report'}
          </button>
        </form>
      </section>

      <Notice error={validation || request.error} />

      <section className="panel">
        <h2>{definition.title}</h2>

        {!request.data && !request.loading && !request.error ? (
          <p className="muted">
            Select a date range and generate the report.
          </p>
        ) : (
          <DataTable
            columns={definition.columns}
            data={rows(request.data)}
            loading={request.loading}
            failed={Boolean(request.error)}
          />
        )}

        {type === 'collection' &&
          request.data &&
          !request.loading &&
          !request.error && (
            <div className="report-totals">
              <span>
                Daily collection
                <strong>
                  {money(request.data.totals?.dailyCollection)}
                </strong>
              </span>
              <span>
                Monthly collection
                <strong>
                  {money(request.data.totals?.monthlyCollection)}
                </strong>
              </span>
              <span>
                Overall total
                <strong>{money(request.data.totals?.total)}</strong>
              </span>
            </div>
          )}
      </section>
    </>
  )
}