import { dateOnly, money } from '../utils/format'
import { useRef } from 'react'
function receiptTime(value) {
  if (!value) return '—'

  const text = String(value).trim()
  const date = new Date(
    /(?:Z|[+-]\d{2}:\d{2})$/i.test(text) ? text : `${text}Z`,
  )

  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Colombo',
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date)
}

export default function Receipt({ receipt, onClose }) {
  const paperRef = useRef(null)

  function printReceipt() {
    if (!paperRef.current) return

    const frame = document.createElement('iframe')
    frame.title = 'Print payment receipt'
    frame.style.cssText =
      'position:fixed;left:-10000px;top:0;width:800px;height:600px;border:0;'

    frame.onload = () => {
      const printWindow = frame.contentWindow
      if (!printWindow) {
        frame.remove()
        return
      }

      printWindow.addEventListener(
        'afterprint',
        () => frame.remove(),
        { once: true },
      )

      printWindow.focus()
      printWindow.print()
    }

    frame.srcdoc = `<!doctype html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Payment receipt</title>
          <style>
            @page { margin: 15mm; }
            * { box-sizing: border-box; }
            body {
              margin: 0;
              color: #111;
              background: white;
              font: 14px Arial, sans-serif;
              line-height: 1.5;
            }
            .receipt-paper {
              max-width: 600px;
              margin: auto;
              overflow-wrap: anywhere;
            }
            .receipt-brand { font-size: 24px; font-weight: bold; }
            h3 { margin-top: 24px; }
            p { margin: 8px 0; }
            dl { margin: 0; }
            dl > div {
              display: flex;
              justify-content: space-between;
              gap: 20px;
              padding: 9px 0;
              border-bottom: 1px solid #ddd;
              break-inside: avoid;
            }
            dt { flex: 1; color: #444; }
            dd { flex: 1.4; margin: 0; text-align: right; }
            .receipt-total {
              display: flex;
              justify-content: space-between;
              gap: 20px;
              margin-top: 24px;
              font-size: 20px;
              font-weight: bold;
            }
            .receipt-thanks { margin-top: 24px; text-align: center; }
          </style>
        </head>
        <body>${paperRef.current.outerHTML}</body>
      </html>`

    document.body.appendChild(frame)
  }

  if (!receipt) return null

  const details = [
    ['Receipt number', receipt.receiptNumber],
    ['Payment number', receipt.paymentNumber],
    ['Vehicle', receipt.vehicleNumber],
    ['Customer', receipt.customerName],
    ['Parking type', receipt.parkingType],
    ['Reference', receipt.referenceNumber || receipt.ticketNumber],
    ...(receipt.entryDateTime
      ? [['Entry', receiptTime(receipt.entryDateTime)]]
      : []),
    ...(receipt.exitDateTime
      ? [['Exit', receiptTime(receipt.exitDateTime)]]
      : []),
    ...(receipt.periodStart
      ? [[
          'Coverage',
          `${dateOnly(receipt.periodStart)} – ${dateOnly(receipt.periodEnd)}`,
        ]]
      : []),
    ['Paid at (Sri Lanka)', receiptTime(receipt.paymentDateTime)],
    ['Payment method', receipt.paymentMethod],
    ['Received by', receipt.operatorName],
  ]

  return (
    <section className="receipt-section">
      <div className="actions no-print">
        <button
          type="button"
          className="primary"
          onClick={printReceipt}
        >
          Print receipt
        </button>
        {onClose && (
          <button type="button" className="secondary" onClick={onClose}>
            Close receipt
          </button>
        )}
      </div>

      <article className="receipt-paper" ref={paperRef}>
        <div className="receipt-brand">
          {receipt.companyName || 'Parking facility'}
        </div>
        {receipt.address && <p>{receipt.address}</p>}
        {receipt.contactNumber && <p>{receipt.contactNumber}</p>}
        <h3>PAYMENT RECEIPT</h3>

        <dl>
          {details.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value ?? '—'}</dd>
            </div>
          ))}
        </dl>

        <div className="receipt-total">
          <span>Total paid</span>
          <strong>{money(receipt.amount)}</strong>
        </div>

        {receipt.remarks && <p>{receipt.remarks}</p>}
        <p className="receipt-thanks">
          {receipt.thankYouMessage || 'Thank you for parking with us.'}
        </p>
      </article>
    </section>
  )
}