import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { API } from '../constants/Api'
import { DataTable, Notice, PageHeader, Status } from '../components/UI'
import Receipt from '../components/Receipt'
import useRequest from '../utils/useRequest'
import { dateOnly, money, rows, today } from '../utils/format'

export default function MonthlyPaymentPage() {
  const [search, setSearch] = useState('')
  const [period, setPeriod] = useState(today().slice(0, 7))
  const [selection, setSelection] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [receipt, setReceipt] = useState(null)
  const [uncertain, setUncertain] = useState(false)
  const requestId = useRef(null)

  const lookup = useRequest('monthly-payment-lookup')
  const save = useRequest('monthly-payment-save')

  function findAgreement(event) {
    event.preventDefault()
    if (lookup.loading || save.loading) return

    setSelection(null)
    setReceipt(null)
    setUncertain(false)
    save.clear()
    requestId.current = null

    lookup.load(API.monthlyPaymentLookup, {
      searchTerm: search.trim(),
      period,
    })
  }

  async function recordPayment() {
    if (!selection || save.loading || uncertain) return

    const amount = Number(selection.amountDue)

    if (
      selection.amountDue === null ||
      selection.amountDue === undefined ||
      !Number.isFinite(amount) ||
      amount < 0
    ) {
      return
    }

    const confirmed = window.confirm(
      `Record ${paymentMethod} payment of ${money(amount)} for ${period}?`,
    )

    if (!confirmed) return
    requestId.current ||= crypto.randomUUID()

    try {
      const result = await save.submit(
        API.monthlyPayments,
        {
          contractID: selection.contractID,
          quoteID: selection.quoteID,
          period,
          paymentMethod,
        },
        'post',
        requestId.current,
      )

      setReceipt(result.receipt)
      setSelection(null)
      lookup.clear()
      requestId.current = null
    } catch {
      setUncertain(true)
    }
  }

  const columns = [
    { key: 'contractNumber', label: 'Contract' },
    { key: 'customerName', label: 'Customer' },
    { key: 'vehicleNumber', label: 'Vehicle' },
    { key: 'startDate', label: 'Valid from', render: dateOnly },
    { key: 'endDate', label: 'Valid to', render: dateOnly },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <Status value={value} />,
    },
    {
      key: 'paymentStatus',
      label: 'Payment',
      render: (value) => <Status value={value} />,
    },
    { key: 'amountDue', label: 'Amount due', render: money },
  ]

  return (
    <>
      <PageHeader title="Monthly payments" />

      <section className="panel">
        <form
          className="monthly-payment-search"
          onSubmit={findAgreement}
        >
          <label className="monthly-search-field" htmlFor="monthly-search">
            <span>Customer or vehicle</span>
            <input
              id="monthly-search"
              value={search}
              required
              maxLength={200}
              placeholder="Customer, mobile or vehicle number"
              disabled={save.loading || lookup.loading}
              onChange={(event) => {
                setSearch(event.target.value)
                setSelection(null)
              }}
            />
          </label>

          <label className="monthly-search-field" htmlFor="monthly-period">
            <span>Payment month</span>
            <input
              id="monthly-period"
              type="month"
              value={period}
              required
              disabled={save.loading || lookup.loading}
              onChange={(event) => {
                setPeriod(event.target.value)
                setSelection(null)
                lookup.clear()
              }}
            />
          </label>

          <button
            type="submit"
            className="primary"
            disabled={lookup.loading || save.loading}
          >
            {lookup.loading ? 'Searching…' : 'Find agreement'}
          </button>
        </form>

        <DataTable
          columns={columns}
          data={rows(lookup.data)}
          loading={lookup.loading}
          failed={Boolean(lookup.error)}
          rowKey="contractID"
          actions={(row) => (
            <button
              className="small-button"
              disabled={
                save.loading ||
                uncertain ||
                !row.quoteID ||
                row.canPay !== true ||
                row.amountDue === null ||
                row.amountDue === undefined ||
                !Number.isFinite(Number(row.amountDue))
              }
              onClick={() => {
                setSelection(row)
                save.clear()
                requestId.current = null
              }}
            >
              Select
            </button>
          )}
        />
      </section>

      <Notice
        error={lookup.error || save.error}
        success={receipt ? 'Monthly payment recorded successfully.' : ''}
      />

      {uncertain && (
        <div className="notice warning">
          The payment result needs checking.{' '}
          <Link to="/payments">Check payments and receipts</Link>{' '}
          before making another payment.
        </div>
      )}

      {selection && (
        <section className="panel">
          <h2>Confirm payment</h2>
          <p>
            {selection.customerName}
            {' · '}
            {selection.vehicleNumber}
            {' · '}
            {period}
          </p>

          <div className="fee-summary">
            <span>Amount due</span>
            <strong>{money(selection.amountDue)}</strong>
          </div>

          <div className="field payment-method">
            <label htmlFor="monthly-method">Payment method</label>
            <select
              id="monthly-method"
              value={paymentMethod}
              disabled={save.loading || uncertain}
              onChange={(event) => setPaymentMethod(event.target.value)}
            >
              <option>Cash</option>
              <option>Card</option>
            </select>
          </div>

          <div className="form-actions">
            <button
              className="primary"
              disabled={save.loading || uncertain}
              onClick={recordPayment}
            >
              {save.loading ? 'Recording…' : 'Confirm monthly payment'}
            </button>
          </div>
        </section>
      )}

      {receipt && (
        <Receipt receipt={receipt} onClose={() => setReceipt(null)} />
      )}
    </>
  )
}