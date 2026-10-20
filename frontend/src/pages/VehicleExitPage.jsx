import { useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { API } from '../constants/Api'
import { Notice, PageHeader, Status } from '../components/UI'
import Receipt from '../components/Receipt'
import useRequest from '../utils/useRequest'
import { dateTime, money } from '../utils/format'

export default function VehicleExitPage() {
  const [params] = useSearchParams()
  const [search, setSearch] = useState(params.get('ticket') || '')
  const [quote, setQuote] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [result, setResult] = useState(null)
  const [validation, setValidation] = useState('')
  const [uncertain, setUncertain] = useState(false)
  const requestId = useRef(null)

  const lookup = useRequest('exit-lookup')
  const save = useRequest('exit-save')

  async function findVehicle(event) {
    event.preventDefault()
    if (lookup.loading || save.loading) return

    setQuote(null)
    setResult(null)
    setValidation('')
    setUncertain(false)
    save.clear()
    requestId.current = null

    const response = await lookup.load(API.exitLookup, {
      searchTerm: search.trim(),
    })

    if (!response.error) {
      setQuote(response.payload)
    }
  }

  async function completeExit() {
    if (!quote || save.loading || uncertain) return

    if (!quote.ticketID || !quote.quoteID) {
      setValidation(
        'The backend must return a ticket ID and a valid fee quote.',
      )
      return
    }

    const monthly = quote.parkingType === 'MONTHLY'

    if (
      !monthly &&
      (
        quote.amountDue === null ||
        quote.amountDue === undefined ||
        !Number.isFinite(Number(quote.amountDue)) ||
        Number(quote.amountDue) < 0
      )
    ) {
      setValidation('The backend did not return a valid parking fee.')
      return
    }

    const confirmed = window.confirm(
      monthly
        ? 'Complete this monthly vehicle exit?'
        : `Confirm ${paymentMethod} payment of ${money(quote.amountDue)} and complete exit?`,
    )

    if (!confirmed) return
    requestId.current ||= crypto.randomUUID()

    try {
      const response = await save.submit(
        monthly ? API.monthlyExit : API.dailyExit,
        {
          ticketID: quote.ticketID,
          quoteID: quote.quoteID,
          paymentMethod: monthly ? null : paymentMethod,
        },
        'post',
        requestId.current,
      )

      setResult(response)
      setQuote(null)
      requestId.current = null
    } catch {
      setUncertain(true)
    }
  }

  const details = quote
    ? [
        ['Vehicle', quote.vehicleNumber],
        ['Ticket', quote.ticketNumber],
        ['Space', quote.spaceCode],
        ['Entry time', dateTime(quote.entryDateTime)],
        ['Exit quote time', dateTime(quote.exitDateTime)],
        ['Duration', quote.durationText],
      ]
    : []

  return (
    <>
      <PageHeader title="Vehicle exit" />

      <section className="panel">
        <form className="search-bar" onSubmit={findVehicle}>
          <label className="search-box">
            <span className="sr-only">Vehicle or ticket number</span>
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setQuote(null)
              }}
              required
              maxLength={200}
              placeholder="Vehicle number or ticket number"
              disabled={save.loading || lookup.loading}
            />
          </label>

          <button
            className="primary"
            disabled={lookup.loading || save.loading}
          >
            {lookup.loading ? 'Searching…' : 'Find vehicle'}
          </button>
        </form>
      </section>

      <Notice
        error={validation || lookup.error || save.error}
        success={
          result
            ? 'Exit completed. The parking space has been released.'
            : ''
        }
      />

      {uncertain && (
        <div className="notice warning">
          <p>
            The payment/exit result could not be confirmed. Check existing
            records before attempting another transaction.
          </p>
          <div className="actions">
            <Link className="secondary" to="/payments">
              Check payments
            </Link>
            <Link className="secondary" to="/current-parking">
              Check current parking
            </Link>
          </div>
        </div>
      )}

      {quote && (
        <section className="panel">
          <div className="section-heading">
            <h2>Parking details</h2>
            <Status value={quote.parkingType} />
          </div>

          <div className="detail-grid">
            {details.map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value || '—'}</strong>
              </div>
            ))}
          </div>

          {quote.parkingType === 'MONTHLY' ? (
            <div className="info-strip">
              {quote.contractNumber}
              {' · '}
              Valid monthly agreement. No normal daily parking fee applies.
            </div>
          ) : (
            <>
              <div className="fee-summary">
                <span>Amount due</span>
                <strong>{money(quote.amountDue)}</strong>
              </div>

              {quote.calculationDescription && (
                <p className="muted">{quote.calculationDescription}</p>
              )}

              <div className="field payment-method">
                <label htmlFor="exit-method">Payment method</label>
                <select
                  id="exit-method"
                  value={paymentMethod}
                  disabled={save.loading || uncertain}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                >
                  <option>Cash</option>
                  <option>Card</option>
                </select>
              </div>
            </>
          )}

          <div className="form-actions">
            <button
              className="primary"
              disabled={save.loading || uncertain}
              onClick={completeExit}
            >
              {save.loading
                ? 'Processing…'
                : quote.parkingType === 'MONTHLY'
                  ? 'Complete monthly exit'
                  : 'Confirm payment & exit'}
            </button>
          </div>
        </section>
      )}

      {result?.receipt && (
        <Receipt
          receipt={result.receipt}
          onClose={() => setResult(null)}
        />
      )}

      {result && !result.receipt && result.parkingType !== 'MONTHLY' && (
        <p className="muted">
          Open Payments & receipts to retrieve the saved receipt.
        </p>
      )}
    </>
  )
}