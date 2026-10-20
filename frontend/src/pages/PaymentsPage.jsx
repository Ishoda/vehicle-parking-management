import { useEffect, useState } from 'react'

import { API } from '../constants/Api'
import { DataTable, Notice, PageHeader, Status } from '../components/UI'
import Receipt from '../components/Receipt'
import useRequest from '../utils/useRequest'
import { dateTime, money, rows, today } from '../utils/format'

export default function PaymentsPage() {
  const [filters, setFilters] = useState({
    from: today(),
    to: today(),
    parkingType: 'ALL',
    searchTerm: '',
  })
  const [validation, setValidation] = useState('')
  const list = useRequest('payments')
  const receipt = useRequest('receipt')
  const { load } = list

  useEffect(() => {
    const task = load(API.payments, {
      from: today(),
      to: today(),
      parkingType: 'ALL',
    })

    return () => task.abort()
  }, [load])

  function applyFilters(event) {
    event.preventDefault()
    setValidation('')
    receipt.clear()

    if (filters.from > filters.to) {
      setValidation('From date must not be after To date.')
      return
    }

    load(API.payments, filters)
  }

  function changeFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value }))
  }

  const columns = [
    { key: 'paymentNumber', label: 'Payment' },
    {
      key: 'parkingType',
      label: 'Type',
      render: (value) => <Status value={value} />,
    },
    { key: 'customerName', label: 'Customer' },
    { key: 'vehicleNumber', label: 'Vehicle' },
    { key: 'amount', label: 'Amount', render: money },
    { key: 'paymentMethod', label: 'Method' },
    { key: 'paymentDateTime', label: 'Paid at', render: dateTime },
    { key: 'operatorName', label: 'Operator' },
  ]

  return (
    <>
      <PageHeader title="Payments & receipts" />

      <section className="panel">
        <form className="filter-grid" onSubmit={applyFilters}>
          {['from', 'to'].map((name) => (
            <label className="field" key={name}>
              <span>{name === 'from' ? 'From' : 'To'}</span>
              <input
                type="date"
                value={filters[name]}
                required
                onChange={(event) => changeFilter(name, event.target.value)}
              />
            </label>
          ))}

          <label className="field">
            <span>Parking type</span>
            <select
              value={filters.parkingType}
              onChange={(event) =>
                changeFilter('parkingType', event.target.value)
              }
            >
              <option>ALL</option>
              <option>DAILY</option>
              <option>MONTHLY</option>
            </select>
          </label>

          <label className="field">
            <span>Search</span>
            <input
              value={filters.searchTerm}
              maxLength={200}
              placeholder="Vehicle, ticket, customer or mobile"
              onChange={(event) =>
                changeFilter('searchTerm', event.target.value)
              }
            />
          </label>

          <button className="primary" disabled={list.loading}>
            Apply filters
          </button>
        </form>
      </section>

      <Notice error={validation || list.error || receipt.error} />

      <section className="panel">
        <DataTable
          columns={columns}
          data={rows(list.data)}
          loading={list.loading}
          failed={Boolean(list.error)}
          rowKey="paymentNumber"
          actions={(row) => (
            <button
              className="small-button"
              disabled={receipt.loading || !row.receiptID}
              onClick={() => {
                receipt.clear()
                receipt.load(`${API.receipts}/${row.receiptID}`)
              }}
            >
              View receipt
            </button>
          )}
        />
      </section>

      {receipt.loading && <p role="status">Loading receipt…</p>}

      {receipt.data && !receipt.loading && !receipt.error && (
        <Receipt receipt={receipt.data} onClose={receipt.clear} />
      )}
    </>
  )
}