import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Users, ShieldCheck, UserCheck, UserX, UserPlus, Pencil, RefreshCw, Save, X,
} from 'lucide-react'
import DashboardLayout from '../components/DashboardLayout'
import * as userService from '../services/UserService'
import { sessionExpired } from '../store/slices/authSlice'
import '../styles/UserManagement.css'

const emptyForm = {
  firstName: '',
  lastName: '',
  username: '',
  userRole: 'O',
  password: '',
}

function errorMessage(error) {
  const data = error.response?.data

  if (data?.message) return data.message

  if (data?.errors) {
    return Object.values(data.errors).flat().join(' ')
  }

  if (error.response?.status === 403) {
    return 'You do not have permission to manage users.'
  }

  return 'The request failed. Please try again.'
}

export default function UserManagementPage() {
  const dispatch = useDispatch()
  const currentUser = useSelector((state) => state.auth.user)

  const [users, setUsers] = useState([])
  const [form, setForm] = useState({ ...emptyForm })
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const currentUserId = Number(currentUser?.userId)
  const editingSelf = editingId === currentUserId
  const busy = loading || saving

  function handleError(requestError) {
    if (requestError.response?.status === 401) {
      dispatch(sessionExpired())
      return
    }

    setError(errorMessage(requestError))
  }

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const result = await userService.getUsers()
        if (active) setUsers(result)
      } catch (requestError) {
        if (!active) return

        if (requestError.response?.status === 401) {
          dispatch(sessionExpired())
        } else {
          setError(errorMessage(requestError))
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    load()

    return () => {
      active = false
    }
  }, [dispatch])

  async function reloadUsers() {
    setLoading(true)
    setError('')

    try {
      setUsers(await userService.getUsers())
    } catch (requestError) {
      handleError(requestError)
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setEditingId(null)
    setForm({ ...emptyForm })
  }

  function changeField(event) {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
  }

  function editUser(user) {
    setEditingId(Number(user.userId))
    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      userRole: user.userRole,
      password: '',
    })
    setError('')
    setSuccess('')
  }

  async function saveUser(event) {
    event.preventDefault()
    if (busy) return

    setError('')
    setSuccess('')

    const details = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      username: form.username.trim(),
      userRole: form.userRole,
    }

    if (!details.firstName || !details.lastName || !details.username) {
      setError('First name, last name and username are required.')
      return
    }

    if (editingId === null) {
      if (
        form.password.length < 12 ||
        new TextEncoder().encode(form.password).length > 72
      ) {
        setError(
          'Password must contain at least 12 characters and no more than 72 UTF-8 bytes.',
        )
        return
      }

      details.password = form.password
    }

    setSaving(true)

    try {
      const result = editingId === null
        ? await userService.createUser(details)
        : await userService.updateUser(editingId, details)

      resetForm()
      setSuccess(result.message)
      await reloadUsers()
    } catch (requestError) {
      handleError(requestError)
    } finally {
      // Clear a newly entered password after either result.
      setForm((previous) => ({ ...previous, password: '' }))
      setSaving(false)
    }
  }

  async function deactivate(user) {
    if (busy) return

    if (!window.confirm(`Deactivate ${user.username}?`)) return

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const result = await userService.deactivateUser(user.userId)

      if (editingId === user.userId) resetForm()

      setSuccess(result.message)
      await reloadUsers()
    } catch (requestError) {
      handleError(requestError)
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout>
      <main className="dashboard-main user-management">
        <header className="users-page-header">
          <div>
            <p className="dashboard-eyebrow">
              Workspace / User management
            </p>
            <h1>Manage users</h1>
            <p className="users-description">
              Manage staff accounts, roles, and access to your workspace.
            </p>
          </div>

          <span className="users-admin-badge">
            <ShieldCheck size={16} aria-hidden="true" />
            Admin workspace
          </span>
        </header>

        {error && (
          <p className="users-feedback users-error" role="alert">
            {error}
          </p>
        )}

        {success && (
          <p className="users-feedback users-success" role="status">
            {success}
          </p>
        )}

        <section className="users-summary" aria-label="Staff account summary">
          {[
            {
              id: 'total',
              label: 'Total accounts',
              value: users.length,
              description: 'Accounts in the current list',
              Icon: Users,
            },
            {
              id: 'active',
              label: 'Active',
              value: users.filter((user) => user.activeStatus).length,
              description: 'Enabled staff accounts',
              Icon: UserCheck,
            },
            {
              id: 'admin',
              label: 'Administrators',
              value: users.filter((user) => user.userRole === 'A').length,
              description: 'Accounts with Admin role',
              Icon: ShieldCheck,
            },
            {
              id: 'inactive',
              label: 'Inactive',
              value: users.filter((user) => !user.activeStatus).length,
              description: 'Disabled staff accounts',
              Icon: UserX,
            },
          ].map(({ id, label, value, description, Icon }) => (
            <div key={id} className={`users-stat users-stat-${id}`}>
              <div className="users-stat-top">
                <span>{label}</span>
                <span className="users-stat-icon">
                  <Icon size={23} aria-hidden="true" />
                </span>
              </div>

              <strong>{loading ? '—' : value}</strong>
              <p>{description}</p>
            </div>
          ))}
        </section>

        <section className="users-panel" aria-labelledby="user-form-title">
          <div className="users-panel-heading">
            <span className="users-panel-icon">
              {editingId === null ? (
                <UserPlus size={22} aria-hidden="true" />
              ) : (
                <Pencil size={22} aria-hidden="true" />
              )}
            </span>

            <div>
              <h2 id="user-form-title">
                {editingId === null
                  ? 'Create staff account'
                  : 'Edit staff account'}
              </h2>
              <p>
                {editingId === null
                  ? 'Enter staff details and assign an account role.'
                  : 'Update the selected staff member’s details.'}
              </p>
            </div>
          </div>

          <form onSubmit={saveUser}>
            <fieldset disabled={busy} className="users-form-grid">
              <legend className="users-sr-only">Staff account details</legend>

              <div className="users-field">
                <label htmlFor="firstName">First name</label>
                <input
                  id="firstName"
                  name="firstName"
                  value={form.firstName}
                  onChange={changeField}
                  maxLength={100}
                  required
                />
              </div>

              <div className="users-field">
                <label htmlFor="lastName">Last name</label>
                <input
                  id="lastName"
                  name="lastName"
                  value={form.lastName}
                  onChange={changeField}
                  maxLength={100}
                  required
                />
              </div>

              <div className="users-field">
                <label htmlFor="staffUsername">Username</label>
                <input
                  id="staffUsername"
                  name="username"
                  value={form.username}
                  onChange={changeField}
                  autoComplete="off"
                  maxLength={100}
                  required
                />
              </div>

              <div className="users-field">
                <label htmlFor="userRole">Role</label>
                <select
                  id="userRole"
                  name="userRole"
                  value={form.userRole}
                  onChange={changeField}
                  disabled={editingSelf}
                  aria-describedby={editingSelf ? 'self-role-help' : undefined}
                >
                  <option value="O">Operator</option>
                  <option value="A">Admin</option>
                </select>

                {editingSelf && (
                  <p id="self-role-help" className="users-field-help">
                    You cannot change your own Admin role.
                  </p>
                )}
              </div>

              {editingId === null && (
                <div className="users-field users-field-wide">
                  <label htmlFor="staffPassword">Initial password</label>
                  <input
                    id="staffPassword"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    value={form.password}
                    onChange={changeField}
                    minLength={12}
                    aria-describedby="staff-password-help"
                    required
                  />
                  <p id="staff-password-help" className="users-field-help">
                    At least 12 characters; maximum 72 UTF-8 bytes.
                  </p>
                </div>
              )}

              <div className="user-actions users-form-actions">
                <button type="submit" className="users-button-primary">
                  {editingId === null ? (
                    <UserPlus size={17} aria-hidden="true" />
                  ) : (
                    <Save size={17} aria-hidden="true" />
                  )}
                  {saving
                    ? 'Saving…'
                    : editingId === null
                      ? 'Create user'
                      : 'Save changes'}
                </button>

                {editingId !== null && (
                  <button
                    type="button"
                    className="users-button-secondary"
                    onClick={resetForm}
                  >
                    <X size={17} aria-hidden="true" />
                    Cancel edit
                  </button>
                )}
              </div>
            </fieldset>
          </form>
        </section>

        <section
          className="users-panel users-list-panel"
          aria-labelledby="staff-list-title"
        >
          <div className="user-list-heading">
            <div>
              <h2 id="staff-list-title">Staff accounts</h2>
              <p>Review account details and manage staff access.</p>
            </div>

            <button
              type="button"
              className="users-button-secondary"
              onClick={reloadUsers}
              disabled={busy}
            >
              <RefreshCw size={16} aria-hidden="true" />
              {loading ? 'Refreshing…' : 'Refresh list'}
            </button>
          </div>

          {loading && (
            <p className="users-loading" role="status">
              Loading users…
            </p>
          )}

          <div
            className="user-table-container"
            role="region"
            aria-label="Staff accounts table"
            tabIndex={0}
          >
            <table>
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Username</th>
                  <th scope="col">Role</th>
                  <th scope="col">Status</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr key={user.userId}>
                    <td>
                      <div className="users-name">
                        <span className="users-avatar" aria-hidden="true">
                          {`${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase()}
                        </span>
                        <div>
                          <strong>
                            {user.firstName} {user.lastName}
                          </strong>
                          {Number(user.userId) === currentUserId && (
                            <small>Your account</small>
                          )}
                        </div>
                      </div>
                    </td>

                    <td>{user.username}</td>

                    <td>
                      <span
                        className={`users-role ${
                          user.userRole === 'A'
                            ? 'users-role-admin'
                            : 'users-role-operator'
                        }`}
                      >
                        {user.userRole === 'A' ? 'Admin' : 'Operator'}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`users-status ${
                          user.activeStatus
                            ? 'users-status-active'
                            : 'users-status-inactive'
                        }`}
                      >
                        {user.activeStatus ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td>
                      <div className="user-actions">
                        <button
                          type="button"
                          className="users-button-edit"
                          disabled={busy}
                          onClick={() => editUser(user)}
                          aria-label={`Edit ${user.username}`}
                        >
                          <Pencil size={15} aria-hidden="true" />
                          Edit
                        </button>

                        <button
                          type="button"
                          className="users-button-danger"
                          disabled={
                            busy ||
                            !user.activeStatus ||
                            Number(user.userId) === currentUserId
                          }
                          onClick={() => deactivate(user)}
                          aria-label={`Deactivate ${user.username}`}
                        >
                          <UserX size={15} aria-hidden="true" />
                          Deactivate
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {!loading && users.length === 0 && (
                  <tr>
                    <td colSpan={5}>No staff accounts to display.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="dashboard-footer">
          Vehicle Parking Management · Staff workspace
        </footer>
      </main>
    </DashboardLayout>
  )
}