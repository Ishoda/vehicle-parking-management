import { useEffect, useState } from 'react'
import {
  ArrowRight,
  ArrowUpRight,
  Banknote,
  CalendarDays,
  Car,
  ChartNoAxesCombined,
  Contact,
  Eye,
  EyeOff,
  Grid2X2,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  ParkingSquare,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  Wallet,
} from 'lucide-react'

import useRequest from '../utils/useRequest'
import { rows } from '../utils/format'

const icons = {
  dashboard: LayoutDashboard,
  entry: LogIn,
  exit: LogOut,
  vehicle: Car,
  space: ParkingSquare,
  rate: Banknote,
  customer: Contact,
  calendar: CalendarDays,
  report: ChartNoAxesCombined,
  users: Users,
  payment: Wallet,
  receipt: Receipt,
  arrow: ArrowRight,
  open: ArrowUpRight,
  refresh: RefreshCw,
  search: Search,
  plus: Plus,
  menu: Menu,
  shield: ShieldCheck,
  eye: Eye,
  eyeOff: EyeOff,
  grid: Grid2X2,
}

export function Icon({ name, size = 20 }) {
  const Component = icons[name] || ParkingSquare
  return <Component size={size} aria-hidden="true" />
}

export function PageHeader({ title, description, children }) {
  return (
    <header className="page-heading">
      <div>
        <p className="eyebrow">PARKLY / STAFF WORKSPACE</p>
        <h1>{title}</h1>
        {description && <p className="muted">{description}</p>}
      </div>
      <div className="actions">{children}</div>
    </header>
  )
}

export function Notice({ error, success }) {
  return (
    <>
      {error && (
        <div className="notice error" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="notice success" role="status">
          {success}
        </div>
      )}
    </>
  )
}

export function Status({ value }) {
  const text =
    typeof value === 'boolean'
      ? value ? 'ACTIVE' : 'INACTIVE'
      : value || 'UNKNOWN'

  return (
    <span className={`badge badge-${String(text).toLowerCase()}`}>
      {String(text).replaceAll('_', ' ')}
    </span>
  )
}

export function DataTable({
  columns,
  data,
  loading,
  failed,
  rowKey,
  actions,
  rowClassName,
}) {
  const columnCount = columns.length + (actions ? 1 : 0)

  return (
    <div
      className="table-wrap"
      role="region"
      aria-label="Results"
      tabIndex={0}
    >
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col">
                {column.label}
              </th>
            ))}
            {actions && <th scope="col">Actions</th>}
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columnCount}>Loading records…</td>
            </tr>
          ) : failed ? (
            <tr>
              <td colSpan={columnCount}>
                Records are unavailable. Please retry.
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columnCount}>No records found.</td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr
                key={row[rowKey] ?? index}
                className={rowClassName ? rowClassName(row) : undefined}
              >
                {columns.map((column) => (
                  <td key={column.key}>
                    {column.render
                      ? column.render(row[column.key], row)
                      : row[column.key] ?? '—'}
                  </td>
                ))}
                {actions && (
                  <td>
                    <div className="actions">{actions(row)}</div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

function RemoteSelect({
  field,
  value,
  form,
  formId,
  disabled,
  onChange,
}) {
  const parentValue = field.dependsOn ? form[field.dependsOn] : null
  const request = useRequest(
    `options:${field.url}:${parentValue || ''}`,
  )
  const { load } = request

  useEffect(() => {
    if (field.dependsOn && !parentValue) return

    const params = field.dependsOn
      ? { [field.dependsOn]: parentValue }
      : undefined

    const task = load(field.url, params)
    return () => task.abort()
  }, [load, field.url, field.dependsOn, parentValue])

  function retry() {
    load(
      field.url,
      field.dependsOn
        ? { [field.dependsOn]: parentValue }
        : undefined,
    )
  }

  return (
    <>
      <select
        id={`${formId}-${field.name}`}
        name={field.name}
        value={value ?? ''}
        onChange={onChange}
        required={field.required}
        disabled={
          disabled ||
          request.loading ||
          Boolean(request.error) ||
          Boolean(field.dependsOn && !parentValue)
        }
      >
        <option value="">
          {request.loading
            ? 'Loading…'
            : `Select ${field.label.toLowerCase()}`}
        </option>

        {rows(request.data).map((item) => (
          <option
            key={item[field.valueKey]}
            value={item[field.valueKey]}
          >
            {item[field.labelKey]}
          </option>
        ))}
      </select>

      {request.error && (
        <small className="field-error">
          {request.error}
          <button
            type="button"
            className="text-button"
            onClick={retry}
          >
            Retry
          </button>
        </small>
      )}
    </>
  )
}

function PasswordField({ field, value, formId, disabled, onChange }) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="password-input">
      <input
        id={`${formId}-${field.name}`}
        type={visible ? 'text' : 'password'}
        value={value ?? ''}
        onChange={onChange}
        required={field.required}
        disabled={disabled}
        min={field.min}
        max={field.max}
        step={field.step}
        minLength={field.minLength}
        maxLength={field.maxLength || 200}
        pattern={field.pattern}
        autoComplete="new-password"
      />
      <button
        type="button"
        className="password-toggle"
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        disabled={disabled}
        onClick={() => setVisible((current) => !current)}
      >
        <Icon name={visible ? 'eyeOff' : 'eye'} size={18} />
      </button>
    </div>
  )
}

export function FormFields({
  fields,
  form,
  setForm,
  disabled,
  formId = 'form',
}) {
  function changeField(event, field) {
    const value = field.uppercase
      ? event.target.value.toUpperCase()
      : event.target.value

    const dependentFields = Object.fromEntries(
      fields
        .filter((item) => item.dependsOn === field.name)
        .map((item) => [item.name, '']),
    )

    setForm((current) => ({
      ...current,
      ...dependentFields,
      [field.name]: value,
    }))
  }

  return (
    <div className="form-grid">
      {fields.map((field) => (
        <div
          key={field.name}
          className={`field ${field.wide ? 'wide' : ''}`}
        >
          <label htmlFor={`${formId}-${field.name}`}>
            {field.label}
            {field.required && <span className="required"> *</span>}
          </label>

          {field.url ? (
            <RemoteSelect
              field={field}
              form={form}
              formId={formId}
              value={form[field.name]}
              disabled={disabled}
              onChange={(event) => changeField(event, field)}
            />
          ) : field.options ? (
            <select
              id={`${formId}-${field.name}`}
              value={form[field.name] ?? ''}
              onChange={(event) => changeField(event, field)}
              required={field.required}
              disabled={disabled}
            >
              {field.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : field.type === 'password' ? (
            <PasswordField
              field={field}
              value={form[field.name]}
              formId={formId}
              disabled={disabled}
              onChange={(event) => changeField(event, field)}
            />
          ) : field.type === 'textarea' ? (
            <textarea
              id={`${formId}-${field.name}`}
              value={form[field.name] ?? ''}
              onChange={(event) => changeField(event, field)}
              disabled={disabled}
              required={field.required}
              maxLength={field.maxLength || 500}
              rows={3}
            />
          ) : (
            <input
              id={`${formId}-${field.name}`}
              type={field.type || 'text'}
              value={form[field.name] ?? ''}
              onChange={(event) => changeField(event, field)}
              required={field.required}
              disabled={disabled}
              min={field.min}
              max={field.max}
              step={field.step}
              minLength={field.minLength}
              maxLength={field.maxLength || 200}
              pattern={field.pattern}
              autoComplete={
                field.type === 'password' ? 'new-password' : undefined
              }
            />
          )}

          {field.help && <small className="muted">{field.help}</small>}
        </div>
      ))}
    </div>
  )
}

export function SearchBar({
  onSearch,
  placeholder = 'Search records…',
  children,
}) {
  const [text, setText] = useState('')

  function submit(event) {
    event.preventDefault()
    onSearch(text.trim())
  }

  function clear() {
    setText('')
    onSearch('')
  }

  return (
    <form className="search-bar" onSubmit={submit}>
      <label className="search-box">
        <Icon name="search" />
        <span className="sr-only">{placeholder}</span>
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={placeholder}
          maxLength={200}
        />
      </label>

      <button type="submit" className="primary">
        Search
      </button>
      <button type="button" className="secondary" onClick={clear}>
        Clear
      </button>

      {children}
    </form>
  )
}