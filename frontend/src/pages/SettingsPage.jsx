import { useEffect, useState } from 'react'
import { Save, Settings } from 'lucide-react'

import { API } from '../constants/Api'
import { Notice, PageHeader } from '../components/UI'
import useRequest from '../utils/useRequest'

const initialForm = {
  facilityName: '',
  address: '',
  contactNumber: '',
  receiptMessage: '',
  dailyThresholdHours: 6,
  monthlyCapacityPercentage: '',
  isActive: 'A',
}

export default function SettingsPage() {
  const [form, setForm] = useState(initialForm)
  const [loaded, setLoaded] = useState(false)
  const [validation, setValidation] = useState('')
  const [message, setMessage] = useState('')
  const settings = useRequest('settings-load')
  const save = useRequest('settings-save')
  const { load } = settings

  useEffect(() => {
    let active = true
    const task = load(API.settings)

    task.unwrap().then((data) => {
      if (!active) return

      setForm({
        facilityName: data.facilityName ?? '',
        address: data.address ?? '',
        contactNumber: data.contactNumber ?? '',
        receiptMessage: data.receiptMessage ?? '',
        dailyThresholdHours: data.dailyThresholdHours ?? 6,
        monthlyCapacityPercentage: data.monthlyCapacityPercentage ?? '',
        isActive: data.isActive ?? 'A',
      })
      setLoaded(true)
    }).catch(() => {
      // useRequest displays the loading error.
    })

    return () => {
      active = false
      task.abort()
    }
  }, [load])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setValidation('')
    setMessage('')
    save.clear()
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!loaded || save.loading) return

    setValidation('')
    setMessage('')
    save.clear()

    const facilityName = form.facilityName.trim()
    const receiptMessage = form.receiptMessage.trim()
    const contactNumber = form.contactNumber.trim()
    const dailyThresholdHours = Number(form.dailyThresholdHours)
    const monthlyCapacityPercentage =
      form.monthlyCapacityPercentage === ''
        ? null
        : Number(form.monthlyCapacityPercentage)

    if (!facilityName || !receiptMessage) {
      setValidation('Facility name and receipt message are required.')
      return
    }

    if (contactNumber && !/^[0-9]{10}$/.test(contactNumber)) {
      setValidation('Contact number must contain exactly 10 digits.')
      return
    }

    if (
      !Number.isInteger(dailyThresholdHours) ||
      dailyThresholdHours < 1 ||
      dailyThresholdHours > 24
    ) {
      setValidation('Daily threshold must be a whole number from 1 to 24.')
      return
    }

    if (
      monthlyCapacityPercentage !== null &&
      (
        !Number.isFinite(monthlyCapacityPercentage) ||
        monthlyCapacityPercentage < 0 ||
        monthlyCapacityPercentage > 100
      )
    ) {
      setValidation('Monthly capacity must be between 0 and 100.')
      return
    }

    if (!['A', 'I'].includes(form.isActive)) {
      setValidation('Select a valid settings status.')
      return
    }

    try {
      await save.submit(
        API.settings,
        {
          facilityName,
          address: form.address.trim() || null,
          contactNumber: contactNumber || null,
          receiptMessage,
          dailyThresholdHours,
          monthlyCapacityPercentage,
          isActive: form.isActive,
        },
        'put',
      )

      setMessage('Settings saved successfully.')
    } catch {
      // useRequest displays the saving error.
    }
  }

  const disabled = settings.loading || save.loading

  return (
    <div className="settings-page">
      <PageHeader
        title="Settings"
        description="Manage facility details, receipt text and parking rules."
      />

      <Notice
        error={validation || settings.error || save.error}
        success={message}
      />

      {settings.loading && (
        <p className="muted" role="status">Loading settings…</p>
      )}

      <form className="settings-form" onSubmit={handleSubmit}>
        <fieldset className="settings-panel" disabled={disabled}>
          <legend>Facility details</legend>
          <div className="settings-fields">
            <label className="settings-field">
              <span>Facility name</span>
              <input
                name="facilityName"
                value={form.facilityName}
                onChange={handleChange}
                required
                maxLength={100}
                placeholder="Enter facility name"
              />
            </label>

            <label className="settings-field">
              <span>Contact number</span>
              <input
                name="contactNumber"
                type="tel"
                inputMode="numeric"
                value={form.contactNumber}
                onChange={handleChange}
                minLength={10}
                maxLength={10}
                pattern="[0-9]{10}"
                placeholder="Optional — 10 digits"
              />
            </label>

            <label className="settings-field settings-wide">
              <span>Address</span>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                maxLength={300}
                rows={3}
                placeholder="Enter facility address"
              />
            </label>

            <label className="settings-field settings-wide">
              <span>Receipt message</span>
              <textarea
                name="receiptMessage"
                value={form.receiptMessage}
                onChange={handleChange}
                required
                maxLength={300}
                rows={3}
                placeholder="Thank you for parking with us."
              />
              <small>Message to display on customer receipts.</small>
            </label>
          </div>
        </fieldset>

        <fieldset className="settings-panel" disabled={disabled}>
          <legend>Parking rules</legend>
          <div className="settings-fields">
            <label className="settings-field">
              <span>Daily threshold (hours)</span>
              <input
                name="dailyThresholdHours"
                type="number"
                value={form.dailyThresholdHours}
                onChange={handleChange}
                required
                min={1}
                max={24}
                step={1}
              />
              <small>Parking duration at which daily charging applies.</small>
            </label>

            <label className="settings-field">
              <span>Monthly capacity (%)</span>
              <input
                name="monthlyCapacityPercentage"
                type="number"
                value={form.monthlyCapacityPercentage}
                onChange={handleChange}
                min={0}
                max={100}
                step="0.01"
                placeholder="Not configured"
              />
              <small>
                Leave blank to store no percentage.
                Enter 0 to explicitly set zero.
              </small>
            </label>

            <label className="settings-field">
              <span>Settings status</span>
              <select
                name="isActive"
                value={form.isActive}
                onChange={handleChange}
                required
              >
                <option value="A">Active</option>
                <option value="I">Inactive</option>
              </select>
            </label>
          </div>
        </fieldset>

        <div className="settings-save-row">
          <span>
            <Settings size={16} />
            Changes apply after saving.
          </span>
          <button
            type="submit"
            className="primary"
            disabled={!loaded || save.loading}
          >
            <Save size={17} />
            {save.loading ? 'Saving…' : 'Save settings'}
          </button>
        </div>
      </form>
    </div>
  )
}