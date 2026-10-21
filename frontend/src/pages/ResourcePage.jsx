import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Pencil, Plus, RefreshCw, RotateCcw, Trash2 } from 'lucide-react'

import {
  DataTable,
  FormFields,
  Notice,
  SearchBar,
  Status,
} from '../components/UI'
import Modal from '../components/Modal'
import useRequest from '../utils/useRequest'
import { rows, today } from '../utils/format'

function localDateTime(value) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
}

function normalizeRecord(row) {
  if (row.activeStatus === 'A') {
    return { ...row, activeStatus: true }
  }

  if (row.activeStatus === 'I') {
    return { ...row, activeStatus: false }
  }

  return row
}

export default function ResourcePage({
  config,
  extraParams,
  fixedValues,
  extraAction,
}) {
  const user = useSelector((state) => state.auth.user)
  const scope = JSON.stringify(extraParams || {})
  const list = useRequest(`list:${config.url}:${scope}`)
  const save = useRequest(`save:${config.url}:${scope}`)
  const { load } = list

  const [form, setForm] = useState(config.defaults || {})
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteRecord, setDeleteRecord] = useState(null)
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')
  const [validation, setValidation] = useState('')

  useEffect(() => {
    const task = load(config.url, {
      ...config.params,
      ...JSON.parse(scope),
    })

    return () => task.abort()
  }, [load, config.url, config.params, scope])

  function refresh() {
    load(config.url, { ...config.params, ...extraParams })
  }

  const records = rows(list.data).map(normalizeRecord)
  const filteredRecords = records.filter((row) =>
    Object.values(row).some((value) =>
      String(value ?? '').toLowerCase().includes(search.toLowerCase()),
    ),
  )

  const statusColumns = [
    'status',
    'spaceStatus',
    'activeStatus',
    'paymentStatus',
  ]

  const columns = config.columns.map((column) =>
    statusColumns.includes(column.key)
      ? { ...column, render: (value) => <Status value={value} /> }
      : column,
  )

  const editingSelf =
    config.id === 'userId' &&
    editingId !== null &&
    Number(editingId) === Number(user.userId)

  const fields = config.fields
    .filter((field) => editingId === null || !field.createOnly)
    .map((field) => {
      if (editingSelf && field.name === 'userRole') {
        return {
          ...field,
          options: field.options.filter(
            (option) => option.value === user.role,
          ),
        }
      }

      return field
    })

  const deactivation = config.toggle || config.deactivate

  function recordName(row) {
    return (
      row.typeName ||
      row.spaceCode ||
      row.customerName ||
      row.username ||
      row.contractNumber ||
      row.rateName ||
      row.vehicleNumber ||
      String(row[config.id])
    )
  }

  function openForm(row) {
    save.clear()
    setMessage('')
    setValidation('')
    setEditingId(row ? row[config.id] : null)

    const values = { ...config.defaults }

    for (const field of config.fields) {
      if (field.type === 'password' || !row) continue

      const value = row[field.name]

      if (field.type === 'datetime-local') {
        values[field.name] = localDateTime(value)
      } else if (field.type === 'date') {
        values[field.name] = value ? String(value).slice(0, 10) : ''
      } else {
        values[field.name] = value ?? ''
      }
    }

    setForm(values)
    setShowForm(true)
  }

  function closeForm() {
    if (save.loading) return

    setShowForm(false)
    setEditingId(null)
    setForm(config.defaults || {})
    setValidation('')
    save.clear()
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (save.loading) return

    setValidation('')
    setMessage('')

    const payload = { ...fixedValues }

    for (const field of fields) {
      const value = form[field.name]

      if (field.numeric) {
        payload[field.name] = Number(value)
      } else if (field.type === 'datetime-local') {
        payload[field.name] = value ? new Date(value).toISOString() : null
      } else if (typeof value === 'string' && field.type !== 'password') {
        payload[field.name] = value.trim() || null
      } else {
        payload[field.name] = value ?? null
      }

      const missing =
        value === undefined ||
        value === null ||
        (typeof value === 'string' && value.trim() === '')

      if (field.required && missing) {
        setValidation(`Enter ${field.label.toLowerCase()}.`)
        return
      }

      if (
        field.numeric &&
        !missing &&
        !Number.isFinite(payload[field.name])
      ) {
        setValidation(`Enter a valid ${field.label.toLowerCase()}.`)
        return
      }
    }

    if (
      config.id === 'contractID' &&
      payload.startDate &&
      payload.startDate < today()
    ) {
      setValidation('Start date must be today or a future date.')
      return
    }

    if (
      payload.startDate &&
      payload.endDate &&
      payload.startDate > payload.endDate
    ) {
      setValidation('End date must be on or after start date.')
      return
    }

    if (
      payload.effectiveFrom &&
      payload.effectiveTo &&
      payload.effectiveTo <= payload.effectiveFrom
    ) {
      setValidation('Effective to must be later than effective from.')
      return
    }

    if (
      payload.password &&
      new TextEncoder().encode(payload.password).length > 72
    ) {
      setValidation('Password must not exceed 72 UTF-8 bytes.')
      return
    }

    try {
      const url = editingId === null
        ? config.url
        : `${config.url}/${encodeURIComponent(editingId)}`

      const method = editingId === null ? 'post' : 'put'
      await save.submit(url, payload, method)

      setShowForm(false)
      setEditingId(null)
      setForm(config.defaults || {})
      setMessage('Record saved successfully.')
      refresh()
    } catch {
      // useRequest displays the error in the modal.
    } finally {
      setForm((current) => ({ ...current, password: '' }))
    }
  }

  function openDelete(row) {
    save.clear()
    setValidation('')
    setMessage('')
    setDeleteRecord(row)
  }

  function closeDelete() {
    if (save.loading) return

    setDeleteRecord(null)
    save.clear()
  }

  async function confirmDelete() {
    if (!deleteRecord || save.loading) return

    const id = encodeURIComponent(deleteRecord[config.id])

    try {
      if (deactivation) {
        await save.submit(
          `${config.url}/${id}/deactivate`,
          undefined,
          'patch',
        )
      } else {
        // Confirm this DELETE endpoint with the backend developer.
        await save.submit(`${config.url}/${id}`, undefined, 'delete')
      }

      setDeleteRecord(null)
      setMessage(
        deactivation
          ? 'Record deactivated successfully.'
          : 'Record deleted successfully.',
      )
      refresh()
    } catch {
      // useRequest displays the error in the modal.
    }
  }

  async function reactivate(row) {
    if (save.loading) return

    save.clear()
    setMessage('')

    try {
      await save.submit(
        `${config.url}/${encodeURIComponent(row[config.id])}/reactivate`,
        undefined,
        'patch',
      )

      setMessage('Record reactivated successfully.')
      refresh()
    } catch {
      // useRequest displays the error above the table.
    }
  }

  async function toggleSpaceBlock(row) {
    if (save.loading) return

    const status = String(row.spaceStatus)
      .trim()
      .toUpperCase()

    const blocked = ['B', 'BLOCKED'].includes(status)
    const available = ['AV', 'AVAILABLE'].includes(status)

    if (!blocked && !available) return

    let reason = null

    if (blocked) {
      if (!window.confirm(
        `Unblock space ${row.spaceCode}?`,
      )) {
        return
      }
    } else {
      const entered = window.prompt(
        `Enter a reason for blocking ${row.spaceCode}:`,
      )

      if (entered === null) return

      reason = entered.trim()

      if (!reason) {
        window.alert('Enter a block reason.')
        return
      }
    }

    setValidation('')
    setMessage('')
    save.clear()

    try {
      await save.submit(
        '/ParkingSpace/UpdateParkingSpaceStatus',
        {
          p_spaceID: String(row.spaceID),
          p_spaceStatus: blocked ? 'AV' : 'B',
          p_blockReason: reason,
        },
        'post',
      )

      setMessage(
        blocked
          ? 'Space unblocked successfully.'
          : 'Space blocked successfully.',
      )

      refresh()
    } catch {
      // The request error appears above the table.
    }
  }

  async function changeContractStatus(row) {
    if (save.loading) return

    const expiring = row.status === 'EXPIRED'
    let reason = null

    if (expiring) {
      if (!window.confirm(
        `Mark ${row.contractNumber} expired and release its reservations?`,
      )) {
        return
      }
    } else {
      const entered = window.prompt(
        `Enter a cancellation reason for ${row.contractNumber}. ` +
        'Linked reservations will be released; payment history is retained.',
      )

      if (entered === null) return

      reason = entered.trim()

      if (!reason || reason.length > 500) {
        window.alert(
          'Enter a cancellation reason between 1 and 500 characters.',
        )
        return
      }
    }

    setMessage('')
    setValidation('')
    save.clear()

    try {
      await save.submit(
        expiring
          ? '/MonthlyContract/ExpireMonthlyContract'
          : '/MonthlyContract/CancelMonthlyContract',
        {
          p_contractID: String(row.contractID),
          ...(expiring
            ? {}
            : { p_cancelledReason: reason }),
        },
        'post',
      )

      setMessage(
        expiring
          ? 'Contract expired successfully.'
          : 'Contract cancelled. Payment history is retained.',
      )

      refresh()
    } catch {
      // The request error appears above the table.
    }
  }

  function canModify(row) {
    return !config.canEdit || config.canEdit(row)
  }

  function deleteDisabled(row) {
    const currentUser =
      config.id === 'userId' &&
      Number(row.userId) === Number(user.userId)

    return (
      save.loading ||
      !canModify(row) ||
      (deactivation && row.activeStatus === false) ||
      currentUser
    )
  }

  return (
    <section className="records-panel">
      <header className="records-heading">
        <div>
          <h2>{config.title}</h2>
          <p>{config.description}</p>
        </div>

        <div className="actions">
          <button
            type="button"
            className="icon-button refresh-icon"
            title="Refresh records"
            aria-label="Refresh records"
            disabled={list.loading}
            onClick={refresh}
          >
            <RefreshCw size={18} aria-hidden="true" />
          </button>

          <button
            type="button"
            className="primary"
            disabled={save.loading}
            onClick={() => openForm(null)}
          >
            <Plus size={18} aria-hidden="true" />
            Add
          </button>
        </div>
      </header>

      <Notice
        error={list.error || (!showForm && !deleteRecord ? save.error : '')}
        success={message}
      />

      <div className="records-search">
        <SearchBar
          onSearch={setSearch}
          placeholder={`Search ${config.title.toLowerCase()}…`}
        />
        <span className="record-count">
          {list.loading ? 'Loading…' : `${filteredRecords.length} records`}
        </span>
      </div>

      <DataTable
        columns={columns}
        data={filteredRecords}
        loading={list.loading}
        failed={Boolean(list.error)}
        rowKey={config.id}
        rowClassName={
          config.blockable
            ? (row) => {
                const status = String(
                  row.spaceStatus ?? '',
                ).trim().toUpperCase()

                const colours = {
                  AV: 'available',
                  AVAILABLE: 'available',
                  B: 'blocked',
                  BLOCKED: 'blocked',
                  OC: 'occupied',
                  OCCUPIED: 'occupied',
                  RE: 'reserved',
                  RESERVED: 'reserved',
                }

                return colours[status]
                  ? `space-row-${colours[status]}`
                  : undefined
              }
            : undefined
        }
        actions={(row) => (
          <>
            <button
              type="button"
              className="icon-button edit-icon"
              title={`Edit ${recordName(row)}`}
              aria-label={`Edit ${recordName(row)}`}
              disabled={save.loading || !canModify(row)}
              onClick={() => openForm(row)}
            >
              <Pencil size={17} aria-hidden="true" />
            </button>

            {config.toggle && row.activeStatus === false ? (
              <button
                type="button"
                className="icon-button restore-icon"
                title={`Reactivate ${recordName(row)}`}
                aria-label={`Reactivate ${recordName(row)}`}
                disabled={save.loading}
                onClick={() => reactivate(row)}
              >
                <RotateCcw
                  size={17}
                  aria-hidden="true"
                />
              </button>
            ) : config.allowDelete !== false ? (
              <button
                type="button"
                className="icon-button delete-icon"
                title={`${
                  deactivation ? 'Deactivate' : 'Delete'
                } ${recordName(row)}`}
                aria-label={`${
                  deactivation ? 'Deactivate' : 'Delete'
                } ${recordName(row)}`}
                disabled={deleteDisabled(row)}
                onClick={() => openDelete(row)}
              >
                <Trash2
                  size={17}
                  aria-hidden="true"
                />
              </button>
            ) : null}

                        {config.blockable && (
              <button
                type="button"
                className="small-button"
                disabled={
                  save.loading ||
                  ![
                    'AV',
                    'AVAILABLE',
                    'B',
                    'BLOCKED',
                  ].includes(
                    String(row.spaceStatus)
                      .trim()
                      .toUpperCase(),
                  )
                }
                onClick={() => toggleSpaceBlock(row)}
              >
                {['B', 'BLOCKED'].includes(
                  String(row.spaceStatus)
                    .trim()
                    .toUpperCase(),
                )
                  ? 'Unblock'
                  : 'Block'}
              </button>
            )}            
            {config.contractActions &&
              row.storedStatus === 'A' &&
              ['ACTIVE', 'UPCOMING', 'EXPIRED'].includes(
                row.status,
              ) && (
                <button
                  type="button"
                  className="small-button"
                  disabled={save.loading}
                  onClick={() =>
                    changeContractStatus(row)
                  }
                >
                  {row.status === 'EXPIRED'
                    ? 'Mark expired'
                    : 'Cancel contract'}
                </button>
              )}

            {extraAction?.(row)}
          </>
        )}
      />

      {showForm && (
        <Modal
          title={
            editingId === null
              ? `Add  ${config.title}`
              : `Edit  ${config.title}`
          }
          onClose={closeForm}
          busy={save.loading}
        >
          <Notice error={validation || save.error} />

          <form onSubmit={handleSubmit}>
            <FormFields
              fields={fields}
              form={form}
              setForm={setForm}
              disabled={save.loading}
              formId={config.id}
            />

            <div className="modal-actions">
              <button
                type="button"
                className="secondary"
                disabled={save.loading}
                onClick={closeForm}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="primary"
                disabled={save.loading}
              >
                {save.loading
                  ? 'Saving…'
                  : editingId === null ? 'Add record' : 'Save changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteRecord && (
        <Modal
          title={deactivation ? 'Deactivate record' : 'Delete record'}
          onClose={closeDelete}
          busy={save.loading}
          small
        >
          <div className="delete-confirm-icon">
            <Trash2 size={25} aria-hidden="true" />
          </div>

          <p className="delete-confirm-text">
            {deactivation ? 'Deactivate' : 'Delete'}{' '}
            <strong>{recordName(deleteRecord)}</strong>?
          </p>

          <Notice error={save.error} />

          <div className="modal-actions">
            <button
              type="button"
              className="secondary"
              disabled={save.loading}
              onClick={closeDelete}
            >
              Cancel
            </button>
            <button
              type="button"
              className="danger-button"
              disabled={save.loading}
              onClick={confirmDelete}
            >
              {save.loading
                ? 'Processing…'
                : deactivation ? 'Deactivate' : 'Delete'}
            </button>
          </div>
        </Modal>
      )}
    </section>
  )
}