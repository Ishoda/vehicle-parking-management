import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { DataTable, Notice, PageHeader, Status } from '../components/UI'
import Modal from '../components/Modal'
import Receipt from '../components/Receipt'
import { loadPaymentHistory } from '../services/PaymentHistoryService'
import { getPaymentReceipt } from '../services/PaymentReceiptService'
import { money, today } from '../utils/format'

function initialFilters() {
  return {
    from: today(),
    to: today(),
    parkingType: 'ALL',
    searchTerm: '',
  }
}

function paidAt(value) {
  if (!value) return '—'

  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Colombo',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export default function PaymentsPage() {
  const [filters, setFilters] = useState(initialFilters)
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [validation, setValidation] = useState('')
  const [receipt, setReceipt] = useState(null)
  const [receiptLoading, setReceiptLoading] = useState(false)
  const [receiptError, setReceiptError] = useState('')
  const controller = useRef(null)
  const receiptRequest = useRef(0)

  async function fetchPayments(values) {
    controller.current?.abort()
    const request = new AbortController()
    controller.current = request

    setLoading(true)
    setError('')
    setPayments([])

    try {
      const records = await loadPaymentHistory(values, request.signal)
      if (!request.signal.aborted) setPayments(records)
    } catch (failure) {
      if (!request.signal.aborted) {
        setError(failure.message || 'Could not load payment history.')
      }
    } finally {
      if (!request.signal.aborted) setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments(initialFilters())

    return () => {
      controller.current?.abort()
      receiptRequest.current += 1
    }
  }, [])

  function applyFilters(event) {
    event.preventDefault()
    setValidation('')

    if (filters.from > filters.to) {
      setValidation('From date must not be after To date.')
      return
    }

    receiptRequest.current += 1
    setReceipt(null)
    setReceiptLoading(false)
    setReceiptError('')
    fetchPayments(filters)
  }

  function changeFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value }))
    setValidation('')
  }

  async function viewReceipt(row) {
    if (receiptLoading) return

    const request = ++receiptRequest.current
    setReceipt(null)
    setReceiptError('')
    setReceiptLoading(true)

    try {
      const saved = await getPaymentReceipt(row.paymentType, row.paymentID)
      if (request === receiptRequest.current) setReceipt(saved)
    } catch (failure) {
      if (request === receiptRequest.current) {
        setReceiptError(failure.message || 'Could not load the receipt.')
      }
    } finally {
      if (request === receiptRequest.current) setReceiptLoading(false)
    }
  }

  const columns = [
    { key: 'paymentNumber', label: 'Payment' },
    { key: 'receiptNumber', label: 'Receipt' },
    {
      key: 'parkingType',
      label: 'Type',
      render: (value) => <Status value={value} />,
    },
    { key: 'customerName', label: 'Customer' },
    { key: 'vehicleNumber', label: 'Vehicle' },
    { key: 'amount', label: 'Amount', render: money },
    { key: 'paymentMethod', label: 'Method' },
    { key: 'paymentDateTime', label: 'Paid at (SL)', render: paidAt },
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
              <option value="ALL">All</option>
              <option value="DAILY">Daily</option>
              <option value="MONTHLY">Monthly</option>
            </select>
          </label>

          <label className="field">
            <span>Search</span>
            <input
              value={filters.searchTerm}
              maxLength={200}
              placeholder="Payment, receipt, vehicle, customer or mobile"
              onChange={(event) =>
                changeFilter('searchTerm', event.target.value)
              }
            />
          </label>

          <button className="primary" disabled={loading || receiptLoading}>
            {loading ? 'Loading…' : 'Apply filters'}
          </button>
        </form>
      </section>

      <Notice error={validation || error || receiptError} />

      <section className="panel">
        <DataTable
          columns={columns}
          data={payments}
          loading={loading}
          failed={Boolean(error)}
          rowKey="paymentKey"
          actions={(row) => (
            <button
              type="button"
              className="small-button"
              disabled={loading || receiptLoading || !row.paymentID}
              onClick={() => viewReceipt(row)}
            >
              View receipt
            </button>
          )}
        />
      </section>

      {receiptLoading && <p role="status">Loading receipt…</p>}

      {receipt && createPortal(
        <Modal
          title="Payment receipt"
          className="receipt-modal"
          onClose={() => setReceipt(null)}
        >
          <Receipt receipt={receipt} onClose={() => setReceipt(null)} />
        </Modal>,
        document.body,
      )}
    </>
  )
}