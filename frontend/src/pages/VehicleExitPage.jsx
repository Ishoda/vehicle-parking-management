import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useSearchParams } from 'react-router-dom'

import { API } from '../constants/Api'
import { Notice, PageHeader, Status } from '../components/UI'
import Modal from '../components/Modal'
import Receipt from '../components/Receipt'
import { getPaymentReceipt } from '../services/PaymentReceiptService'
import useRequest from '../utils/useRequest'
import { dateTime, money } from '../utils/format'

export default function VehicleExitPage() {
  const [params] = useSearchParams()
  const [search, setSearch] = useState(params.get('ticket') || '')
  const [quote, setQuote] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('CH')
  const [result, setResult] = useState(null)
  const [validation, setValidation] = useState('')
  const [uncertain, setUncertain] = useState(false)
  const [receipt, setReceipt] = useState(null)
  const [receiptLoading, setReceiptLoading] = useState(false)
  const [receiptError, setReceiptError] = useState('')
  const requestId = useRef(null)
  const submitting = useRef(false)
  const receiptBusy = useRef(false)

  const lookup = useRequest('exit-lookup')
  const save = useRequest('exit-save')

  const monthly = quote?.parkingType === 'MONTHLY'
  const alreadyPaid = quote?.ticketStatus === 'PP'
  const needsPayment = Boolean(quote) && !monthly && !alreadyPaid
  const busy = lookup.loading || save.loading

  async function viewReceipt() {
    if (!result?.paymentID || receiptBusy.current) return

    receiptBusy.current = true
    setReceiptLoading(true)
    setReceiptError('')

    try {
      const savedReceipt = await getPaymentReceipt('D', result.paymentID)
      setReceipt(savedReceipt)
    } catch (error) {
      setReceiptError(error.message || 'Could not load the saved receipt.')
    } finally {
      receiptBusy.current = false
      setReceiptLoading(false)
    }
  }

  async function findVehicle(event) {
    event.preventDefault()
    if (busy || submitting.current || receiptBusy.current) return

    setQuote(null)
    setResult(null)
    setReceipt(null)
    setReceiptError('')
    setValidation('')
    setUncertain(false)
    save.clear()
    requestId.current = null

    const searchTerm = search.trim()

    if (!searchTerm) {
      setValidation('Enter a vehicle number or ticket number.')
      return
    }

    try {
      const ticket = await lookup.load(
        API.exitLookup,
        { searchTerm },
      ).unwrap()

      setQuote(ticket)
    } catch {
      // useRequest displays the lookup error.
    }
  }

  async function completeExit() {
    if (!quote || busy || uncertain || submitting.current) return

    setValidation('')

    if (!quote.ticketID) {
      setValidation('Find the vehicle again to load its ticket.')
      return
    }

    if (
      needsPayment &&
      (
        quote.amountDue == null ||
        !Number.isFinite(Number(quote.amountDue)) ||
        Number(quote.amountDue) < 0 ||
        !quote.calculationTimeUTC ||
        !['CH', 'CD'].includes(paymentMethod)
      )
    ) {
      setValidation('Find the vehicle again to refresh its fee preview.')
      return
    }

    const confirmed = window.confirm(
      needsPayment
        ? `Confirm ${paymentMethod === 'CH' ? 'Cash' : 'Card'} payment of ${money(quote.amountDue)} and complete exit?`
        : monthly
          ? 'Complete this monthly vehicle exit?'
          : 'Payment is already recorded. Complete vehicle exit?',
    )

    if (!confirmed) return

    submitting.current = true
    requestId.current ||= crypto.randomUUID()

    try {
      const response = await save.submit(
        monthly ? API.monthlyExit : API.dailyExit,
        {
          ticketID: quote.ticketID,
          ticketStatus: quote.ticketStatus,
          paymentMethod: needsPayment ? paymentMethod : null,
          expectedAmount: needsPayment ? quote.amountDue : null,
          calculationTimeUTC: needsPayment
            ? quote.calculationTimeUTC
            : null,
        },
        'post',
        requestId.current,
      )

      setResult({
        ...response,
        vehicleNumber: quote.vehicleNumber,
      })
      setQuote(null)
      requestId.current = null
    } catch {
      setUncertain(true)
    } finally {
      submitting.current = false
    }
  }

  const details = quote
    ? [
        ['Vehicle', quote.vehicleNumber],
        ['Ticket', quote.ticketNumber],
        ['Space', quote.spaceCode],
        ['Entry time', dateTime(quote.entryDateTime)],
        ...(needsPayment
          ? [
              ['Fee calculated at', dateTime(quote.calculationTimeUTC)],
              ['Billable hours', quote.billableHours ?? '—'],
            ]
          : []),
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
                setValidation('')
              }}
              required
              maxLength={200}
              placeholder="Vehicle number or ticket number"
              disabled={busy || receiptLoading}
            />
          </label>

          <button className="primary" disabled={busy || receiptLoading}>
            {lookup.loading ? 'Searching…' : 'Find vehicle'}
          </button>
        </form>
      </section>

      <Notice
        error={validation || lookup.error || save.error}
        success={result ? 'Vehicle exit completed successfully.' : ''}
      />

      {uncertain && (
        <div className="notice warning">
          <p>
            The transaction result could not be confirmed.
            Check Current Parking before retrying. If the ticket is still
            listed, find it again to load its latest payment status.
          </p>
          <Link className="secondary" to="/current-parking">
            Check current parking
          </Link>
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
                <strong>{value ?? '—'}</strong>
              </div>
            ))}
          </div>

          {monthly && (
            <div className="info-strip">
              {quote.contractNumber
                ? `${quote.contractNumber} · `
                : ''}
              Monthly exit. The backend verifies the payment coverage
              recorded for this entry.
            </div>
          )}

          {!monthly && alreadyPaid && (
            <div className="info-strip">
              Payment is already recorded
              {quote.paidAmount != null
                ? ` (${money(quote.paidAmount)})`
                : ''}.
              Complete the exit without collecting another payment.
            </div>
          )}

          {needsPayment && (
            <>
              <div className="fee-summary">
                <span>Amount to collect</span>
                <strong>{money(quote.amountDue)}</strong>
              </div>

              <p className="muted small">
                The fee preview is valid for two minutes.
                Click Find vehicle again to refresh it if needed.
              </p>

              <div className="field payment-method">
                <label htmlFor="exit-method">Payment method</label>
                <select
                  id="exit-method"
                  value={paymentMethod}
                  disabled={busy || uncertain}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                >
                  <option value="CH">Cash</option>
                  <option value="CD">Card</option>
                </select>
              </div>
            </>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="primary"
              disabled={busy || uncertain}
              onClick={completeExit}
            >
              {save.loading
                ? 'Processing…'
                : needsPayment
                  ? 'Confirm payment & exit'
                  : monthly
                    ? 'Complete monthly exit'
                    : 'Complete paid vehicle exit'}
            </button>
          </div>
        </section>
      )}

      {result && (
        <section className="panel success-panel">
          <h2>Exit completed</h2>

          <div className="detail-grid">
            <div>
              <span>Ticket</span>
              <strong>{result.ticketNumber}</strong>
            </div>
            <div>
              <span>Vehicle</span>
              <strong>{result.vehicleNumber}</strong>
            </div>
            <div>
              <span>Exit time</span>
              <strong>{dateTime(result.exitDateTime)}</strong>
            </div>
            <div>
              <span>Space</span>
              <strong>{result.spaceID}</strong>
            </div>
            <div>
              <span>Space status</span>
              <strong>
                {result.spaceStatus === 'RE'
                  ? 'Reserved'
                  : result.spaceStatus === 'AV'
                    ? 'Available'
                    : result.spaceStatus}
              </strong>
            </div>

            {result.paymentNumber && (
              <>
                <div>
                  <span>Payment number</span>
                  <strong>{result.paymentNumber}</strong>
                </div>
                <div>
                  <span>Receipt number</span>
                  <strong>{result.receiptNumber || '—'}</strong>
                </div>
                <div>
                  <span>Paid amount</span>
                  <strong>{money(result.amount)}</strong>
                </div>
              </>
            )}
          </div>

          <Notice error={receiptError} />

          <div className="form-actions">
            {result.paymentID && result.parkingType === 'DAILY' && (
              <button
                type="button"
                className="primary"
                disabled={receiptLoading}
                onClick={viewReceipt}
              >
                {receiptLoading ? 'Loading receipt…' : 'View receipt'}
              </button>
            )}

            <Link className="secondary" to="/current-parking">
              Open current parking
            </Link>
          </div>
        </section>
      )}

      {receipt && createPortal(
        <Modal
          title="Payment receipt"
          className="receipt-modal"
          onClose={() => setReceipt(null)}
        >
          <Receipt
            receipt={receipt}
            onClose={() => setReceipt(null)}
          />
        </Modal>,
        document.body,
      )}
    </>
  )
}