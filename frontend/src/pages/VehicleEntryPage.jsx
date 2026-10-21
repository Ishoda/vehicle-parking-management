import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { API } from '../constants/Api'
import { vehicleTypeField } from '../constants/Resources'
import { FormFields, Notice, PageHeader } from '../components/UI'
import useRequest from '../utils/useRequest'
import { dateTime, rows } from '../utils/format'

const emptyForm = {
  vehicleID: '',
  vehicleNumber: '',
  vehicleTypeID: '',
  parkingType: 'D',
  spaceID: '',
  customerName: '',
  mobileNumber: '',
  entryDescription: '',
}

export default function VehicleEntryPage() {
  const [form, setForm] = useState(emptyForm)
  const [ticket, setTicket] = useState(null)
  const [validation, setValidation] = useState('')
  const [uncertain, setUncertain] = useState(false)
  const requestId = useRef(null)
  const isDaily = form.parkingType === 'D'

  // Keep each vehicle type's space list separate.
  const spaces = useRequest(`entry-spaces:${form.vehicleTypeID}`)
  const save = useRequest('entry-save')
  const { load, clear } = spaces

  useEffect(() => {
    clear()
    if (!isDaily || !form.vehicleTypeID) return

    const task = load(
      `${API.entrySpaces}/${encodeURIComponent(form.vehicleTypeID)}`,
    )

    return () => task.abort()
  }, [isDaily, form.vehicleTypeID, load, clear])

  const availableSpaces = rows(spaces.data)

  function updateForm(update) {
    setForm((current) => {
      const next = typeof update === 'function' ? update(current) : update
      const selectionChanged =
        next.vehicleTypeID !== current.vehicleTypeID ||
        next.parkingType !== current.parkingType

      return selectionChanged ? { ...next, spaceID: '' } : next
    })

    setValidation('')
  }

  const fields = [
    {
      name: 'vehicleNumber',
      label: 'Vehicle number',
      required: true,
      uppercase: true,
      pattern: '[A-Z0-9 -]+',
      maxLength: 30,
    },
    vehicleTypeField,
    {
      name: 'parkingType',
      label: 'Parking type',
      required: true,
      options: [
        { value: 'D', label: 'Daily parking' },
        { value: 'M', label: 'Monthly parking' },
      ],
    },
    ...(isDaily
      ? [
          {
            name: 'vehicleID',
            label: 'Vehicle ID for a new vehicle',
            maxLength: 10,
            help:
              'Required by the current procedure for an unregistered vehicle. ' +
              'Leave blank for an existing vehicle.',
          },
          {
            name: 'spaceID',
            label: 'Parking space (optional)',
            help:
              'Leave Automatic allocation selected to let the server choose. ' +
              'Listed spaces are checked for reservation conflicts when submitting.',
            options: [
              { value: '', label: 'Automatically allocate' },
              ...availableSpaces.map((space) => ({
                value: String(space.spaceID),
                label: space.spaceCode,
              })),
            ],
          },
          {
            name: 'customerName',
            label: 'Customer name (optional)',
            maxLength: 200,
          },
          {
            name: 'mobileNumber',
            label: 'Mobile number (optional)',
            type: 'tel',
            minLength: 10,
            maxLength: 10,
            pattern: '[0-9]{10}',
            help: 'If supplied, enter exactly 10 digits.',
          },
        ]
      : []),
    {
      name: 'entryDescription',
      label: 'Entry description (optional)',
      type: 'textarea',
      maxLength: 500,
      wide: true,
    },
  ]

  async function handleSubmit(event) {
    event.preventDefault()
    if (save.loading || uncertain) return

    setValidation('')
    setTicket(null)

    const vehicleNumber = form.vehicleNumber.trim().toUpperCase()
    const vehicleTypeID = String(form.vehicleTypeID).trim()
    const vehicleID = form.vehicleID.trim()
    const mobileNumber = form.mobileNumber.trim()

    if (!vehicleNumber || !/^[A-Z0-9 -]+$/.test(vehicleNumber)) {
      setValidation('Enter a valid vehicle number.')
      return
    }

    if (!vehicleTypeID) {
      setValidation('Select a vehicle type.')
      return
    }

    if (!['D', 'M'].includes(form.parkingType)) {
      setValidation('Select Daily or Monthly parking.')
      return
    }

    if (isDaily && mobileNumber && !/^[0-9]{10}$/.test(mobileNumber)) {
      setValidation('Mobile number must contain exactly 10 digits.')
      return
    }

    if (
      isDaily &&
      (
        spaces.loading ||
        spaces.error ||
        spaces.data === null ||
        spaces.data === undefined
      )
    ) {
      setValidation('Load the available spaces before continuing.')
      return
    }

    if (isDaily && availableSpaces.length === 0) {
      setValidation('No compatible daily parking spaces are available.')
      return
    }

    if (
      isDaily &&
      form.spaceID &&
      !availableSpaces.some(
        (space) => String(space.spaceID) === String(form.spaceID),
      )
    ) {
      setValidation('Select a space from the current available list.')
      return
    }

    requestId.current ||= crypto.randomUUID()

    const payload = {
      vehicleNumber,
      vehicleTypeID,
      parkingType: form.parkingType,
      // The backend resolves the reserved space for monthly entry.
      spaceID: isDaily && form.spaceID ? String(form.spaceID) : null,
      vehicleID: isDaily && vehicleID ? vehicleID : null,
      customerName: isDaily ? form.customerName.trim() || null : null,
      mobileNumber: isDaily ? mobileNumber || null : null,
      entryDescription: form.entryDescription.trim() || null,
    }

    try {
      const result = await save.submit(
        isDaily ? API.dailyEntry : API.monthlyEntry,
        payload,
        'post',
        requestId.current,
      )

      setTicket({
        ...result,
        vehicleNumber: result?.vehicleNumber || vehicleNumber,
        parkingType: result?.parkingType || form.parkingType,
      })

      setForm(emptyForm)
      requestId.current = null
    } catch {
      setUncertain(true)
    }
  }

  function startAgain() {
    setUncertain(false)
    setValidation('')
    save.clear()
    requestId.current = null
    setForm(emptyForm)
  }

  function refreshSpaces() {
    if (!isDaily || !form.vehicleTypeID || save.loading || uncertain) {
      return
    }

    setForm((current) => ({ ...current, spaceID: '' }))
    load(`${API.entrySpaces}/${encodeURIComponent(form.vehicleTypeID)}`)
  }

  const dailySpacesUnavailable =
    isDaily &&
    (
      spaces.loading ||
      Boolean(spaces.error) ||
      spaces.data === null ||
      spaces.data === undefined ||
      availableSpaces.length === 0
    )

  return (
    <>
      <PageHeader title="Vehicle entry" />
      <Notice
        error={validation || save.error || (isDaily ? spaces.error : '')}
      />

      {ticket && (
        <section className="panel success-panel">
          <h2>Entry registered</h2>
          <div className="detail-grid">
            <div>
              <span>Ticket number</span>
              <strong>{ticket.ticketNumber || '—'}</strong>
            </div>
            <div>
              <span>Vehicle</span>
              <strong>{ticket.vehicleNumber}</strong>
            </div>
            <div>
              <span>Space</span>
              <strong>{ticket.spaceCode || ticket.spaceID || '—'}</strong>
            </div>
            <div>
              <span>Entry time</span>
              <strong>{dateTime(ticket.entryDateTime)}</strong>
            </div>
            <div>
              <span>Parking type</span>
              <strong>
                {['M', 'MONTHLY'].includes(ticket.parkingType)
                  ? 'Monthly'
                  : 'Daily'}
              </strong>
            </div>
            {ticket.contractNumber && (
              <div>
                <span>Contract</span>
                <strong>{ticket.contractNumber}</strong>
              </div>
            )}
          </div>
        </section>
      )}

      {uncertain && (
        <div className="notice warning">
          <p>
            Review the error and check current parking before starting
            another entry. The request may have reached the server.
          </p>
          <div className="actions">
            <Link className="secondary" to="/current-parking">
              Check current parking
            </Link>
            <button className="secondary" onClick={startAgain}>
              I checked — start a new entry
            </button>
          </div>
        </div>
      )}

      <section className="panel">
        <form onSubmit={handleSubmit}>
          <FormFields
            fields={fields}
            form={form}
            setForm={updateForm}
            disabled={save.loading || uncertain}
            formId="entry"
          />

          <div className="info-strip">
            Entry date and time are recorded by the server.{' '}
            {isDaily
              ? 'Daily entry requires configured rates, active parking settings and a compatible space without a conflicting monthly reservation.'
              : 'Monthly entry requires a registered vehicle, active contract, completed payment covering today and an available reserved space. The backend selects that reserved space.'}
          </div>

          {isDaily && form.vehicleTypeID && (
            <p className="muted small">
              {spaces.loading
                ? 'Loading candidate spaces…'
                : spaces.error
                  ? 'Available spaces could not be loaded.'
                  : `${availableSpaces.length} candidate spaces. Final availability is checked when submitting.`}

              <button
                type="button"
                className="text-button"
                disabled={spaces.loading || save.loading || uncertain}
                onClick={refreshSpaces}
              >
                Refresh spaces
              </button>
            </p>
          )}

          <div className="form-actions">
            <button
              className="primary"
              disabled={
                save.loading ||
                uncertain ||
                !form.vehicleTypeID ||
                dailySpacesUnavailable
              }
            >
              {save.loading
                ? 'Registering…'
                : isDaily
                  ? 'Register daily entry'
                  : 'Register monthly entry'}
            </button>
          </div>
        </form>
      </section>
    </>
  )
}