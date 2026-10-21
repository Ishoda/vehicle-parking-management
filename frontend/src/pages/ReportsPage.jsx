import { useEffect, useRef, useState } from 'react'

import { DataTable, Notice, PageHeader } from '../components/UI'
import { loadReport } from '../services/ReportService'
import { loadSettings } from '../services/SettingsService'
import { dateOnly, money, today } from '../utils/format'

function localTime(value) {
  if (!value) return '—'

  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Colombo',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

const amount = (value) => value == null ? '—' : money(value)

const definitions = {
  collection: {
    title: 'Daily collection report',
    columns: [
      { key: 'date', label: 'Date', render: dateOnly },
      { key: 'dailyPaymentCount', label: 'Daily payments' },
      { key: 'dailyCollection', label: 'Daily collection', render: amount },
      { key: 'monthlyPaymentCount', label: 'Monthly payments' },
      { key: 'monthlyCollection', label: 'Monthly collection', render: amount },
      { key: 'total', label: 'Total', render: amount },
    ],
  },
  vehicles: {
    title: 'Vehicle entry / exit report',
    columns: [
      { key: 'ticketNumber', label: 'Ticket' },
      { key: 'vehicleNumber', label: 'Vehicle' },
      { key: 'parkingType', label: 'Type' },
      { key: 'spaceCode', label: 'Space' },
      { key: 'status', label: 'Status' },
      { key: 'entryDateTime', label: 'Entry (SL)', render: localTime },
      { key: 'exitDateTime', label: 'Exit (SL)', render: localTime },
      { key: 'amount', label: 'Calculated amount', render: amount },
    ],
  },
  monthly: {
    title: 'Monthly customer report',
    columns: [
      { key: 'contractNumber', label: 'Contract' },
      { key: 'customerName', label: 'Customer' },
      { key: 'vehicleNumber', label: 'Vehicle' },
      { key: 'monthlyFee', label: 'Monthly fee', render: amount },
      { key: 'startDate', label: 'Valid from', render: dateOnly },
      { key: 'endDate', label: 'Valid to', render: dateOnly },
      { key: 'status', label: 'Contract status' },
      { key: 'paidToday', label: 'Paid coverage today' },
      { key: 'paymentCount', label: 'Completed payments' },
      { key: 'totalPaid', label: 'Total paid', render: amount },
    ],
  },
}

export default function ReportsPage() {
  const [type, setType] = useState('collection')
  const [filters, setFilters] = useState({
    from: today(),
    to: today(),
    parkingType: 'ALL',
    searchTerm: '',
  })
  const [records, setRecords] = useState([])
  const [generated, setGenerated] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [facility, setFacility] = useState(null)
  const [facilityError, setFacilityError] = useState('')
  const controller = useRef(null)
  const reportRef = useRef(null)
  const definition = definitions[type]

  useEffect(() => {
    const settingsController = new AbortController()

    loadSettings(settingsController.signal)
      .then((settings) => {
        if (!settingsController.signal.aborted) setFacility(settings)
      })
      .catch(() => {
        if (!settingsController.signal.aborted) {
          setFacilityError('Facility details could not load. Refresh before printing.')
        }
      })

    return () => {
      settingsController.abort()
      controller.current?.abort()
    }
  }, [])

  function changeType(nextType) {
    controller.current?.abort()
    setType(nextType)
    setRecords([])
    setGenerated(null)
    setLoading(false)
    setError('')
  }

  function changeFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value }))
  }

  async function generateReport(event) {
    event.preventDefault()
    setError('')

    if (filters.from > filters.to) {
      setError('From date must not be after To date.')
      return
    }

    controller.current?.abort()
    const request = new AbortController()
    controller.current = request

    setLoading(true)
    setGenerated(null)
    setRecords([])

    try {
      const data = await loadReport(type, filters, request.signal)

      if (!request.signal.aborted) {
        setRecords(data)
        setGenerated({
          ...filters,
          at: new Date().toISOString(),
        })
      }
    } catch (failure) {
      if (!request.signal.aborted) {
        setError(failure.message || 'Could not generate the report.')
      }
    } finally {
      if (!request.signal.aborted) setLoading(false)
    }
  }

  function printReport() {
    if (!reportRef.current || !generated || !facility) return

    const frame = document.createElement('iframe')
    frame.title = 'Print report'
    frame.style.cssText =
      'position:fixed;left:-10000px;top:0;width:1100px;height:800px;border:0;'

    frame.onload = () => {
      const target = frame.contentWindow
      if (!target) {
        frame.remove()
        return
      }

      target.addEventListener('afterprint', () => frame.remove(), { once: true })
      target.focus()
      target.print()
    }

    frame.srcdoc = `<!doctype html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Parking report</title>
          <style>
            @page { size: A4 landscape; margin: 12mm; }
            body { font: 11px Arial, sans-serif; color: #111; }
            h2 { margin: 0 0 8px; }
            p { margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 18px; }
            th, td { border: 1px solid #ccc; padding: 7px; text-align: left; }
            th { background: #eee; }
            thead { display: table-header-group; }
            tr { break-inside: avoid; }
            .report-totals { display: flex; gap: 28px; margin-top: 20px; }
            .report-totals strong { display: block; margin-top: 5px; }
            .table-wrapper, .table-scroll { overflow: visible; }
          </style>
        </head>
        <body>${reportRef.current.innerHTML}</body>
      </html>`

    document.body.appendChild(frame)
  }

  const totals = records.reduce(
    (sum, row) => ({
      daily: sum.daily + Number(row.dailyCollection ?? 0),
      monthly: sum.monthly + Number(row.monthlyCollection ?? 0),
      total: sum.total + Number(row.total ?? 0),
    }),
    { daily: 0, monthly: 0, total: 0 },
  )

  return (
    <>
      <PageHeader title="Reports" />

      <div className="master-tabs" role="group" aria-label="Report type">
        {Object.entries(definitions).map(([key, report]) => (
          <button
            key={key}
            type="button"
            className={`master-tab ${type === key ? 'active' : ''}`}
            aria-pressed={type === key}
            onClick={() => changeType(key)}
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
                onChange={(event) => changeFilter(name, event.target.value)}
              />
            </label>
          ))}

          {type === 'vehicles' && (
            <label className="field">
              <span>Parking type</span>
              <select
                value={filters.parkingType}
                onChange={(event) => changeFilter('parkingType', event.target.value)}
              >
                <option value="ALL">All</option>
                <option value="D">Daily</option>
                <option value="M">Monthly</option>
              </select>
            </label>
          )}

          {type !== 'collection' && (
            <label className="field">
              <span>Search</span>
              <input
                value={filters.searchTerm}
                maxLength={200}
                placeholder="Search report records"
                onChange={(event) => changeFilter('searchTerm', event.target.value)}
              />
            </label>
          )}

          <button className="primary" disabled={loading}>
            {loading ? 'Generating…' : 'Generate report'}
          </button>

          <button
            type="button"
            className="secondary"
            disabled={loading || !generated || !facility}
            onClick={printReport}
          >
            Print / Save as PDF
          </button>
        </form>
      </section>

      <Notice error={error || facilityError} />

      <section className="panel">
        <div ref={reportRef}>
          <h2>{definition.title}</h2>

          {generated && (
            <>
              <p><strong>{facility?.facilityName || 'Parking facility'}</strong></p>
              {facility?.address && <p>{facility.address}</p>}
              <p>
                Period: {dateOnly(generated.from)} – {dateOnly(generated.to)}
              </p>
              <p>Generated: {localTime(generated.at)} · Sri Lanka time</p>
              {type === 'vehicles' && (
                <p>
                  Parking type: {{
                    ALL: 'All',
                    D: 'Daily',
                    M: 'Monthly',
                  }[generated.parkingType]}
                </p>
              )}
              {type !== 'collection' && generated.searchTerm.trim() && (
                <p>Search: {generated.searchTerm.trim()}</p>
              )}
              <p>Records: {records.length}</p>
            </>
          )}

          {!generated && !loading && !error ? (
            <p className="muted">Select a date range and generate the report.</p>
          ) : (
            <DataTable
              columns={definition.columns}
              data={records}
              loading={loading}
              failed={Boolean(error)}
            />
          )}

          {generated && type === 'collection' && (
            <div className="report-totals">
              <span>Daily collection<strong>{money(totals.daily)}</strong></span>
              <span>Monthly collection<strong>{money(totals.monthly)}</strong></span>
              <span>Overall total<strong>{money(totals.total)}</strong></span>
            </div>
          )}
        </div>
      </section>
    </>
  )
}