import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import DashboardLayout from '../components/DashboardLayout'
import { sessionExpired } from '../store/slices/authSlice'
import {
  createDailyEntry,
  getEntrySpaces,
  getEntryVehicleTypes,
} from '../services/VehicleEntryService'
import '../styles/VehicleEntryPage.css'

const initialForm = {
  vehicleNumber: '',
  vehicleTypeID: '',
  parkingType: 'DAILY',
  spaceID: '',
  customerName: '',
  mobileNumber: '',
}

function getErrorMessage(error) {
  const data = error.response?.data

  if (data?.message) return data.message

  if (data?.errors) {
    return Object.values(data.errors).flat().join(' ')
  }

  return (
    'Could not confirm entry. Check current parking before resubmitting ' +
    'if the request may have reached the server.'
  )
}

export default function VehicleEntryPage() {
  const dispatch = useDispatch()

  const [form, setForm] = useState(initialForm)
  const [vehicleTypes, setVehicleTypes] = useState([])
  const [spaces, setSpaces] = useState([])
  const [typesLoading, setTypesLoading] = useState(true)
  const [spacesLoading, setSpacesLoading] = useState(false)
  const [spacesLoaded, setSpacesLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [ticket, setTicket] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function loadTypes() {
      try {
        const data = await getEntryVehicleTypes(controller.signal)

        if (!controller.signal.aborted) {
          setVehicleTypes(data)
        }
      } catch (requestError) {
        if (controller.signal.aborted) return

        if (requestError.response?.status === 401) {
          dispatch(sessionExpired())
        } else {
          setError(getErrorMessage(requestError))
        }
      } finally {
        if (!controller.signal.aborted) {
          setTypesLoading(false)
        }
      }
    }

    loadTypes()

    return () => controller.abort()
  }, [dispatch])

  useEffect(() => {
    const controller = new AbortController()

    if (!form.vehicleTypeID) return () => controller.abort()

    async function loadSpaces() {
      setSpacesLoading(true)
      setSpacesLoaded(false)
      setSpaces([])

      try {
        const data = await getEntrySpaces(
          form.vehicleTypeID,
          controller.signal,
        )

        if (!controller.signal.aborted) {
          setSpaces(data)
          setSpacesLoaded(true)
        }
      } catch (requestError) {
        if (controller.signal.aborted) return

        if (requestError.response?.status === 401) {
          dispatch(sessionExpired())
        } else {
          setError(getErrorMessage(requestError))
        }
      } finally {
        if (!controller.signal.aborted) {
          setSpacesLoading(false)
        }
      }
    }

    loadSpaces()

    return () => controller.abort()
  }, [dispatch, form.vehicleTypeID, refreshKey])

  function changeField(event) {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'vehicleTypeID' ? { spaceID: '' } : {}),
    }))

    if (name === 'vehicleTypeID') {
      setSpaces([])
      setSpacesLoaded(false)
    }
  }

  function refreshSpaces() {
    setForm((current) => ({ ...current, spaceID: '' }))
    setError('')
    setRefreshKey((current) => current + 1)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setTicket(null)

    const vehicleNumber = form.vehicleNumber.trim().toUpperCase()

    if (!vehicleNumber || !/^[A-Z0-9 -]+$/.test(vehicleNumber)) {
      setError('Enter a valid vehicle number.')
      return
    }

    const mobileNumber = form.mobileNumber.trim()

    if (
      mobileNumber &&
      (mobileNumber.length < 7 || mobileNumber.length > 20)
    ) {
      setError('Mobile number must contain between 7 and 20 characters.')
      return
    }

    setSaving(true)

    try {
      const result = await createDailyEntry({
        vehicleNumber,
        vehicleTypeID: Number(form.vehicleTypeID),
        parkingType: form.parkingType,
        spaceID: form.spaceID ? Number(form.spaceID) : null,
        customerName: form.customerName.trim(),
        mobileNumber,
      })

      setTicket(result)

      setForm((current) => ({
        ...initialForm,
        vehicleTypeID: current.vehicleTypeID,
      }))

      setRefreshKey((current) => current + 1)
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        dispatch(sessionExpired())
      } else {
        setError(getErrorMessage(requestError))

        if (requestError.response?.status === 409) {
          setForm((current) => ({ ...current, spaceID: '' }))
          setRefreshKey((current) => current + 1)
        }
      }
    } finally {
      setSaving(false)
    }
  }

  const canSubmit =
    !saving &&
    !typesLoading &&
    !spacesLoading &&
    spacesLoaded &&
    spaces.length > 0

  return (
    <DashboardLayout>
      <main className="entry-page">
        <h1>Vehicle entry</h1>
        <p>Register an arriving vehicle and allocate an available space.</p>

        {error && (
          <p className="entry-error" role="alert">
            {error}
          </p>
        )}

        {ticket && (
          <section className="entry-success" aria-live="polite">
            <h2>Entry registered</h2>
            <p><strong>Ticket:</strong> {ticket.ticketNumber}</p>
            <p><strong>Vehicle:</strong> {ticket.vehicleNumber}</p>
            <p><strong>Space ID:</strong> {ticket.spaceID}</p>
            <p>
              <strong>Entry time:</strong>{' '}
              {new Date(ticket.entryDateTime).toLocaleString()}
            </p>
          </section>
        )}

        <form className="entry-form" onSubmit={handleSubmit}>
          <fieldset disabled={saving || typesLoading}>
            <label>
              Vehicle number
              <input
                name="vehicleNumber"
                value={form.vehicleNumber}
                onChange={changeField}
                maxLength={30}
                required
              />
            </label>

            <label>
              Vehicle type
              <select
                name="vehicleTypeID"
                value={form.vehicleTypeID}
                onChange={changeField}
                required
              >
                <option value="">Select vehicle type</option>
                {vehicleTypes.map((type) => (
                  <option
                    key={type.vehicleTypeID}
                    value={type.vehicleTypeID}
                  >
                    {type.typeName}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Parking type
              <select
                name="parkingType"
                value={form.parkingType}
                onChange={changeField}
                required
              >
                <option value="DAILY">Daily</option>
                <option value="MONTHLY" disabled>
                  Monthly — contract entry integration pending
                </option>
              </select>
            </label>

            <label>
              Parking space
              <select
                name="spaceID"
                value={form.spaceID}
                onChange={changeField}
                disabled={
                  !form.vehicleTypeID ||
                  spacesLoading ||
                  !spacesLoaded
                }
              >
                <option value="">Automatically allocate a space</option>
                {spaces.map((space) => (
                  <option key={space.spaceID} value={space.spaceID}>
                    {space.spaceCode}
                    {space.spaceName ? ` — ${space.spaceName}` : ''}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              disabled={!form.vehicleTypeID || spacesLoading}
              onClick={refreshSpaces}
            >
              Refresh available spaces
            </button>

            {spacesLoading && (
              <p role="status">Loading available spaces…</p>
            )}

            {form.vehicleTypeID &&
              spacesLoaded &&
              spaces.length === 0 && (
                <p role="status">
                  No available spaces for this vehicle type.
                </p>
              )}

            <label>
              Customer name — optional
              <input
                name="customerName"
                value={form.customerName}
                onChange={changeField}
                maxLength={200}
              />
            </label>

            <label>
              Mobile number — optional
              <input
                name="mobileNumber"
                type="tel"
                value={form.mobileNumber}
                onChange={changeField}
                maxLength={20}
              />
            </label>

            <p>
              Entry date and time are recorded by the server when entry succeeds.
            </p>

            <button type="submit" disabled={!canSubmit}>
              {saving ? 'Registering…' : 'Register daily entry'}
            </button>
          </fieldset>
        </form>
      </main>
    </DashboardLayout>
  )
}