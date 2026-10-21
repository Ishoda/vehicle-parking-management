import { useEffect, useRef, useState } from 'react'

import { API } from '../constants/Api'
import {
  DataTable, FormFields, Notice,
  PageHeader, SearchBar, Status,
} from '../components/UI'
import Receipt from '../components/Receipt'
import useRequest from '../utils/useRequest'
import { dateOnly, money, rows, today } from '../utils/format'
import Modal from '../components/Modal'

const endpoint = '/MonthlyPayment'
const emptyForm = {
  reservationID: '', periodStart: '', periodEnd: '',
  amount: '', paymentMethod: 'CH', remarks: '',
}

const column = (key, label, render) => ({ key, label, render })

const contractColumns = [
  column('contractNumber', 'Contract'),
  column('customerName', 'Customer'),
  column('vehicleNumber', 'Vehicle'),
  column('monthlyFee', 'Contract monthly fee', money),
  column('startDate', 'Start', dateOnly),
  column('endDate', 'End', dateOnly),
  column('status', 'Status', (value) => <Status value={value} />),
]

const historyColumns = [
  column('vpp_payment_number', 'Payment'),
  column('vpm_contract_number', 'Contract'),
  column('vpc_customer_name', 'Customer'),
  column('vpv_vehicle_number', 'Vehicle'),
  column('vpp_period_start_date', 'Coverage start', dateOnly),
  column('vpp_period_end_date', 'Coverage end', dateOnly),
  column('vpp_amount', 'Collected', money),
  column('vpp_payment_status', 'Status',
    (value) => value === 'C' ? 'Completed' : value),
]

function paymentRows(data) {
  return rows(data).map((row) => Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key.toLowerCase(), value]),
  ))
}

function paymentReceipt(row) {
  return {
    companyName: row.vps_facility_name,
    receiptNumber: row.vpp_receipt_number,
    paymentNumber: row.vpp_payment_number,
    vehicleNumber: row.vpv_vehicle_number,
    customerName: row.vpc_customer_name,
    parkingType: 'MONTHLY',
    periodStart: row.vpp_period_start_date,
    periodEnd: row.vpp_period_end_date,
    paymentDateTime: row.vpp_payment_date,
    paymentMethod: ({ CH: 'Cash', CD: 'Card' })[row.vpp_payment_method]
      || row.vpp_payment_method,
    operatorName: row.receivedby,
    amount: row.vpp_amount,
    thankYouMessage: row.vps_receipt_message,
  }
}

export default function MonthlyPaymentPage() {
  const contracts = useRequest('monthly-contract-lookup')
  const history = useRequest('monthly-payment-history')
  const save = useRequest('monthly-payment-save')
  const receiptRequest = useRequest('monthly-payment-receipt')
  const { load } = contracts
  const { submit: loadHistory } = history
  const submitting = useRef(false)

  const [selection, setSelection] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [validation, setValidation] = useState('')
  const [saved, setSaved] = useState(null)
  const [receipt, setReceipt] = useState(null)
  const [receiptError, setReceiptError] = useState('')
  const [uncertain, setUncertain] = useState(false)

  const busy = save.loading || history.loading || receiptRequest.loading
  const contractID = selection?.contractID

  useEffect(() => {
    const task = load(API.monthlyContracts)
    return () => task.abort()
  }, [load])

  useEffect(() => {
    loadHistory(
      `${endpoint}/GetMonthlyPayments`,
      contractID ? { p_contractID: String(contractID) } : {},
      'post',
    ).catch(() => {
      // The history error is displayed below.
    })
  }, [loadHistory, contractID])

  function refreshHistory() {
    return loadHistory(
      `${endpoint}/GetMonthlyPayments`,
      contractID ? { p_contractID: String(contractID) } : {},
      'post',
    ).catch(() => {
      // The history error is displayed below.
    })
  }

  function searchContracts(searchTerm) {
    if (!busy && !uncertain) {
      load(API.monthlyContracts, { searchTerm })
    }
  }

  function selectContract(row) {
    if (busy || uncertain || submitting.current) return

    setSelection(row)
    setValidation('')
    setSaved(null)
    setReceipt(null)
    setReceiptError('')
    save.clear()
    receiptRequest.clear()

    setForm({
      ...emptyForm,
      periodStart: row.startDate > today() ? row.startDate : today(),
      periodEnd: row.endDate,
    })
  }

  async function openReceipt(paymentID) {
    setReceipt(null)
    setReceiptError('')
    receiptRequest.clear()

    try {
      const data = await receiptRequest.submit(
        `${endpoint}/GetMonthlyPaymentByID`,
        { p_monthlyPaymentID: String(paymentID) },
        'post',
      )
      const row = paymentRows(data)[0]

      if (!row?.vpp_receipt_number) {
        setReceiptError('Receipt details were not returned. Retry from history.')
        return
      }

      setReceipt(paymentReceipt(row))
    } catch {
      // Receipt errors are separate from payment saving.
    }
  }

  async function recordPayment(event) {
    event.preventDefault()
    if (!selection || busy || uncertain || saved || submitting.current) return

    setValidation('')
    const reservationID = form.reservationID.trim()
    const amount = Number(form.amount)

    if (!reservationID || reservationID.length > 10) {
      setValidation('Enter a unique reservation ID of up to 10 characters.')
      return
    }

    if (
      !form.periodStart || !form.periodEnd ||
      form.periodStart > form.periodEnd ||
      form.periodStart < selection.startDate ||
      form.periodEnd > selection.endDate ||
      form.periodEnd < today() ||
      form.periodEnd === '9999-12-31'
    ) {
      setValidation(
        'Choose coverage within the contract dates that has not already ended.',
      )
      return
    }

    if (String(form.amount).trim() === '' || !Number.isFinite(amount) || amount < 0) {
      setValidation('Enter the confirmed amount collected.')
      return
    }

    if (!['CH', 'CD'].includes(form.paymentMethod)) {
      setValidation('Select Cash or Card.')
      return
    }

    const method = form.paymentMethod === 'CH' ? 'Cash' : 'Card'
    if (!window.confirm(
      `Record ${money(amount)} by ${method} for ${selection.contractNumber}, ` +
      `covering ${form.periodStart} to ${form.periodEnd}? ` +
      'A compatible space will be reserved.',
    )) return

    submitting.current = true

    try {
      const data = await save.submit(
        `${endpoint}/AddMonthlyPayment`,
        {
          p_contractID: String(selection.contractID),
          p_periodStartDate: form.periodStart,
          p_periodEndDate: form.periodEnd,
          p_amount: String(amount),
          p_paymentMethod: form.paymentMethod,
          p_reservationID: reservationID,
          p_spaceID: null,
          p_remarks: form.remarks.trim() || null,
        },
        'post',
      )
      const result = paymentRows(data)[0] || {}

      setSaved(result)
      await refreshHistory()

      if (result.vpp_monthly_payment_id) {
        await openReceipt(result.vpp_monthly_payment_id)
      }
    } catch (error) {
      setValidation(typeof error === 'string'
        ? error
        : 'Check payment history before attempting another payment.')
      setUncertain(true)
    } finally {
      submitting.current = false
    }
  }

  function startAnotherPayment() {
    if (busy || submitting.current) return
    if (uncertain && !window.confirm(
      'Have you checked history and confirmed whether the payment was recorded?',
    )) return

    setSelection(null)
    setForm(emptyForm)
    setSaved(null)
    setReceipt(null)
    setReceiptError('')
    setValidation('')
    setUncertain(false)
    save.clear()
    receiptRequest.clear()
  }

  const fields = [
    {
      name: 'reservationID', label: 'Reservation ID',
      required: true, maxLength: 10,
      help: 'Unique internal ID, for example RS001.',
    },
    {
      name: 'periodStart', label: 'Coverage start', type: 'date',
      required: true, min: selection?.startDate, max: selection?.endDate,
    },
    {
      name: 'periodEnd', label: 'Coverage end', type: 'date',
      required: true, min: form.periodStart || selection?.startDate,
      max: selection?.endDate,
    },
    {
      name: 'amount', label: 'Amount collected (LKR)', type: 'number',
      required: true, min: 0, max: 9999999999.99, step: '0.01',
    },
    {
      name: 'paymentMethod', label: 'Payment method', required: true,
      options: [
        { value: 'CH', label: 'Cash' },
        { value: 'CD', label: 'Card' },
      ],
    },
    {
      name: 'remarks', label: 'Remarks', type: 'textarea',
      maxLength: 500, wide: true,
    },
  ]

  return (
    <>
      <PageHeader title="Monthly payments" />
      <Notice
        error={validation || save.error}
        success={saved ? 'Payment recorded and space reservation saved.' : ''}
      />

      <section className="panel">
        <h2>Find a contract</h2>
        <SearchBar
          onSearch={searchContracts}
          placeholder="Contract, customer, vehicle or mobile…"
        />
        <Notice error={contracts.error} />
        <DataTable
          columns={contractColumns}
          data={rows(contracts.data)}
          loading={contracts.loading}
          failed={Boolean(contracts.error)}
          rowKey="contractID"
          actions={(row) => (
            <button
              type="button"
              className="small-button"
              disabled={busy || uncertain ||
                !['ACTIVE', 'UPCOMING'].includes(row.status)}
              onClick={() => selectContract(row)}
            >
              Select
            </button>
          )}
        />
      </section>

      {selection && (
        <section className="panel">
          <h2>Payment for {selection.contractNumber}</h2>
          <p>{selection.customerName} · {selection.vehicleNumber}</p>
          <p className="info-strip">
            Contract monthly fee: {money(selection.monthlyFee)}.
            {' '}Enter the actual confirmed amount collected.
            Coverage is not automatically priced or prorated.
            A compatible space is allocated by the backend.
          </p>

          <form onSubmit={recordPayment}>
            <FormFields
              fields={fields}
              form={form}
              setForm={setForm}
              disabled={busy || uncertain || Boolean(saved)}
              formId="monthly-payment"
            />
            <div className="form-actions">
              <button
                type="submit"
                className="primary"
                disabled={busy || uncertain || Boolean(saved)}
              >
                {save.loading ? 'Recording…' : 'Confirm payment & reserve space'}
              </button>
              <button
                type="button"
                className="secondary"
                disabled={busy}
                onClick={startAnotherPayment}
              >
                {uncertain
                  ? 'I checked payment history — continue'
                  : 'Start another payment'}
              </button>
            </div>
          </form>
        </section>
      )}

      {saved && (
        <section className="panel">
          <h2>Payment recorded</h2>
          <p>
            Payment: {saved.vpp_payment_number || 'See history'}<br />
            Receipt: {saved.vpp_receipt_number || 'See history'}<br />
            Reserved space ID: {saved.vpr_space_id || 'See records'}
          </p>
        </section>
      )}

      {uncertain && (
        <div className="notice warning" role="alert">
          Check payment history before submitting again.
          The previous request may have reached the server.
        </div>
      )}

      <section className="panel">
        <div className="section-heading">
          <h2>Payment history</h2>
          <button
            type="button"
            className="secondary"
            disabled={busy}
            onClick={refreshHistory}
          >
            Refresh history
          </button>
        </div>
        <Notice error={history.error} />
        <DataTable
          columns={historyColumns}
          data={paymentRows(history.data)}
          loading={history.loading}
          failed={Boolean(history.error)}
          rowKey="vpp_monthly_payment_id"
          actions={(row) => (
            <button
              type="button"
              className="small-button"
              disabled={busy || !row.vpp_monthly_payment_id}
              onClick={() => openReceipt(row.vpp_monthly_payment_id)}
            >
              View receipt
            </button>
          )}
        />
      </section>

      <Notice error={receiptError || receiptRequest.error} />
      {receiptRequest.loading && <p role="status">Loading receipt…</p>}
            {receipt && (
        <Modal
          title="Payment receipt"
          onClose={() => setReceipt(null)}
          className="receipt-modal"
        >
          <Receipt receipt={receipt} />
        </Modal>
      )}
    </>
  )
}