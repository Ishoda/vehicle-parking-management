import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import DashboardLayout from '../components/DashboardLayout'
import { sessionExpired } from '../store/slices/authSlice'
import {
  createRate,
  getRates,
  getRateVehicleTypes,
  updateRate,
} from '../services/ParkingRateService'
import '../styles/ParkingRatePage.css'

function toLocalInput(value) {
  const date = value ? new Date(value) : new Date()

  const pad = (number) => String(number).padStart(2, '0')

  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-` +
    `${pad(date.getDate())}T${pad(date.getHours())}:` +
    `${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  )
}

function emptyForm() {
  return {
    vehicleTypeID: '',
    rateName: '',
    rateAmount: '',
    rateUnit: 'HOURLY',
    effectiveFrom: toLocalInput(),
    effectiveTo: '',
  }
}

function errorMessage(error, fallback) {
  const data = error.response?.data

  if (data?.message) return data.message

  if (data?.errors) {
    const messages = Object.values(data.errors).flat()
    if (messages.length > 0) return messages.join(' ')
  }

  if (error.response?.status === 403) {
    return 'You do not have permission to manage parking rates.'
  }

  return fallback
}

function displayDate(value) {
  return value ? new Date(value).toLocaleString() : 'No end date'
}

export default function ParkingRatePage() {
  const dispatch = useDispatch()

  const [rates, setRates] = useState([])
  const [vehicleTypes, setVehicleTypes] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function loadData() {
      setLoading(true)
      setError('')

      try {
        const [rateData, typeData] = await Promise.all([
          getRates(controller.signal),
          getRateVehicleTypes(controller.signal),
        ])

        if (controller.signal.aborted) return

        setRates(rateData)
        setVehicleTypes(typeData)
      } catch (requestError) {
        if (controller.signal.aborted) return

        if (requestError.response?.status === 401) {
          dispatch(sessionExpired())
          return
        }

        setError(
          errorMessage(
            requestError,
            'Could not load parking rates. Please refresh and try again.',
          ),
        )
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadData()

    return () => controller.abort()
  }, [dispatch, refreshKey])

  function changeField(event) {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  function resetForm() {
    setEditingId(null)
    setForm(emptyForm())
    setError('')
  }

  function startEditing(rate) {
    setEditingId(rate.rateID)

    setForm({
      vehicleTypeID: String(rate.vehicleTypeID),
      rateName: rate.rateName,
      rateAmount: String(rate.rateAmount),
      rateUnit: rate.rateUnit,
      effectiveFrom: toLocalInput(rate.effectiveFrom),
      effectiveTo: rate.effectiveTo
        ? toLocalInput(rate.effectiveTo)
        : '',
    })

    setError('')
    setSuccess('')
  }

  async function handleSubmit(event) {
    event.preventDefault()

    setError('')
    setSuccess('')

    const amountText = form.rateAmount.trim()
    const amount = Number(amountText)
    const vehicleTypeId = Number(form.vehicleTypeID)

    if (!Number.isInteger(vehicleTypeId) || vehicleTypeId <= 0) {
      setError('Select a vehicle type.')
      return
    }

    if (!form.rateName.trim()) {
      setError('Enter a rate name.')
      return
    }

    if (
      !/^\d+(\.\d{1,2})?$/.test(amountText) ||
      !Number.isFinite(amount) ||
      amount < 0 ||
      amount > 9999999999.99
    ) {
      setError(
        'Enter a nonnegative amount with no more than two decimal places.',
      )
      return
    }

    const effectiveFrom = new Date(form.effectiveFrom)
    const effectiveTo = form.effectiveTo
      ? new Date(form.effectiveTo)
      : null

    if (
      Number.isNaN(effectiveFrom.getTime()) ||
      (effectiveTo && Number.isNaN(effectiveTo.getTime()))
    ) {
      setError('Enter valid effective dates.')
      return
    }

    if (effectiveTo && effectiveTo <= effectiveFrom) {
      setError('Effective to must be later than effective from.')
      return
    }

    const request = {
      vehicleTypeID: vehicleTypeId,
      rateName: form.rateName.trim(),
      rateAmount: amount,
      rateUnit: form.rateUnit,
      effectiveFrom: effectiveFrom.toISOString(),
      effectiveTo: effectiveTo ? effectiveTo.toISOString() : null,
    }

    setSaving(true)

    try {
      const result = editingId === null
        ? await createRate(request)
        : await updateRate(editingId, request)

      setSuccess(result.message || 'Rate saved successfully.')
      setEditingId(null)
      setForm(emptyForm())
      setRefreshKey((current) => current + 1)
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        dispatch(sessionExpired())
        return
      }

      setError(
        errorMessage(
          requestError,
          'Could not save the rate. Please try again.',
        ),
      )
    } finally {
      setSaving(false)
    }
  }

  function vehicleTypeName(vehicleTypeId) {
    const type = vehicleTypes.find(
      (item) => item.vehicleTypeID === vehicleTypeId,
    )

    return type?.typeName || `Vehicle type #${vehicleTypeId}`
  }

  const selectedTypeMissing =
    form.vehicleTypeID !== '' &&
    !vehicleTypes.some(
      (type) => type.vehicleTypeID === Number(form.vehicleTypeID),
    )

  return (
    <DashboardLayout>
      <main className="rates-page">
        <header className="rates-header">
          <div>
            <h1>Parking rates</h1>
            <p>Manage hourly and daily rates for active vehicle types.</p>
          </div>

          <button
            type="button"
            disabled={loading || saving}
            onClick={() => setRefreshKey((current) => current + 1)}
          >
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </header>

        {error && (
          <p className="rates-error" role="alert">
            {error}
          </p>
        )}

        {success && (
          <p className="rates-success" role="status">
            {success}
          </p>
        )}

        <section className="rates-card">
          <h2>{editingId === null ? 'Create rate' : 'Edit rate'}</h2>

          {!loading && vehicleTypes.length === 0 && (
            <p role="status">
              No active vehicle types are available. Create or activate
              a vehicle type before adding rates.
            </p>
          )}

          <form className="rates-form" onSubmit={handleSubmit}>
            <fieldset
              disabled={loading || saving || vehicleTypes.length === 0}
            >
              <div className="rates-form-grid">
                <label>
                  Vehicle type
                  <select
                    name="vehicleTypeID"
                    value={form.vehicleTypeID}
                    onChange={changeField}
                    required
                  >
                    <option value="">Select vehicle type</option>

                    {selectedTypeMissing && (
                      <option value={form.vehicleTypeID} disabled>
                        Current vehicle type is inactive — select an active type
                      </option>
                    )}

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
                  Rate name
                  <input
                    name="rateName"
                    value={form.rateName}
                    onChange={changeField}
                    maxLength={100}
                    required
                  />
                </label>

                <label>
                  Unit
                  <select
                    name="rateUnit"
                    value={form.rateUnit}
                    onChange={changeField}
                    required
                  >
                    <option value="HOURLY">Hourly</option>
                    <option value="DAILY">Daily</option>
                  </select>
                </label>

                <label>
                  Amount
                  <input
                    name="rateAmount"
                    type="number"
                    min="0"
                    max="9999999999.99"
                    step="0.01"
                    value={form.rateAmount}
                    onChange={changeField}
                    required
                  />
                </label>

                <label>
                  Effective from
                  <input
                    name="effectiveFrom"
                    type="datetime-local"
                    step="1"
                    value={form.effectiveFrom}
                    onChange={changeField}
                    required
                  />
                </label>

                <label>
                  Effective to — optional
                  <input
                    name="effectiveTo"
                    type="datetime-local"
                    step="1"
                    value={form.effectiveTo}
                    onChange={changeField}
                  />
                </label>
              </div>

              <p className="rates-hint">
                Dates are shown in your local time and stored in UTC.
                One active rate is permitted per vehicle type and unit.
              </p>

              <div className="rates-actions">
                <button type="submit">
                  {saving
                    ? 'Saving…'
                    : editingId === null
                      ? 'Create rate'
                      : 'Save changes'}
                </button>
              </div>
            </fieldset>

            {editingId !== null && (
              <button
                type="button"
                className="rates-cancel"
                disabled={saving}
                onClick={resetForm}
              >
                Cancel editing
              </button>
            )}
          </form>
        </section>

        <section className="rates-card">
          <h2>Configured rates</h2>

          {loading ? (
            <p role="status">Loading rates…</p>
          ) : (
            <div className="rates-table-wrapper">
              <table className="rates-table">
                <thead>
                  <tr>
                    <th>Vehicle type</th>
                    <th>Name</th>
                    <th>Unit</th>
                    <th>Amount</th>
                    <th>Effective from</th>
                    <th>Effective to</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {rates.map((rate) => (
                    <tr key={rate.rateID}>
                      <td>{vehicleTypeName(rate.vehicleTypeID)}</td>
                      <td>{rate.rateName}</td>
                      <td>{rate.rateUnit}</td>
                      <td>{Number(rate.rateAmount).toFixed(2)}</td>
                      <td>{displayDate(rate.effectiveFrom)}</td>
                      <td>{displayDate(rate.effectiveTo)}</td>
                      <td>
                        {rate.activeStatus ? 'Active' : 'Inactive'}
                      </td>
                      <td>
                        <button
                          type="button"
                          disabled={saving || !rate.activeStatus}
                          onClick={() => startEditing(rate)}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}

                  {rates.length === 0 && (
                    <tr>
                      <td colSpan={8}>No parking rates found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </DashboardLayout>
  )
}