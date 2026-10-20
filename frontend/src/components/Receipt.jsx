import { dateOnly, dateTime, money } from '../utils/format'

export default function Receipt({ receipt, onClose }) {
  if (!receipt) return null

  return (
    <section className="receipt-section">
      <div className="section-heading no-print">
        <h2>Payment receipt</h2>

        <div className="actions">
          <button className="primary" onClick={() => window.print()}>
            Print receipt
          </button>

          {onClose && (
            <button className="secondary" onClick={onClose}>
              Close receipt
            </button>
          )}
        </div>
      </div>

      <article className="receipt-paper" id="print-receipt">
        <div className="receipt-brand">
          {receipt.companyName || 'Parking facility'}
        </div>
        <p>PAYMENT RECEIPT</p>

        <dl>
          <div>
            <dt>Receipt number</dt>
            <dd>{receipt.receiptNumber}</dd>
          </div>
          <div>
            <dt>Payment number</dt>
            <dd>{receipt.paymentNumber}</dd>
          </div>
          <div>
            <dt>Vehicle</dt>
            <dd>{receipt.vehicleNumber || '—'}</dd>
          </div>
          <div>
            <dt>Customer</dt>
            <dd>{receipt.customerName || '—'}</dd>
          </div>
          <div>
            <dt>Parking type</dt>
            <dd>{receipt.parkingType}</dd>
          </div>

          {receipt.ticketNumber && (
            <div>
              <dt>Ticket</dt>
              <dd>{receipt.ticketNumber}</dd>
            </div>
          )}

          {receipt.entryDateTime && (
            <div>
              <dt>Entry</dt>
              <dd>{dateTime(receipt.entryDateTime)}</dd>
            </div>
          )}

          {receipt.exitDateTime && (
            <div>
              <dt>Exit</dt>
              <dd>{dateTime(receipt.exitDateTime)}</dd>
            </div>
          )}

          {receipt.periodStart && (
            <div>
              <dt>Monthly period</dt>
              <dd>
                {dateOnly(receipt.periodStart)}
                {' – '}
                {dateOnly(receipt.periodEnd)}
              </dd>
            </div>
          )}

          <div>
            <dt>Paid at</dt>
            <dd>{dateTime(receipt.paymentDateTime)}</dd>
          </div>
          <div>
            <dt>Payment method</dt>
            <dd>{receipt.paymentMethod}</dd>
          </div>
          <div>
            <dt>Operator</dt>
            <dd>{receipt.operatorName || '—'}</dd>
          </div>
        </dl>

        <div className="receipt-total">
          <span>Total paid</span>
          <strong>{money(receipt.amount)}</strong>
        </div>

        <p className="receipt-thanks">
          {receipt.thankYouMessage || 'Thank you for parking with us.'}
        </p>
      </article>
    </section>
  )
}