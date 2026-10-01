import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
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
    setEditingId(user.userId)
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
    <main className="user-management">
      <header>
        <h1>Manage users</h1>
        <Link to="/">Back to dashboard</Link>
      </header>

      {error && <p role="alert">{error}</p>}
      {success && <p role="status">{success}</p>}

      <section aria-labelledby="user-form-title">
        <h2 id="user-form-title">
          {editingId === null ? 'Create staff account' : 'Edit staff account'}
        </h2>

        <form onSubmit={saveUser}>
          <fieldset disabled={busy}>
            <label htmlFor="firstName">First name</label>
            <input
              id="firstName"
              name="firstName"
              value={form.firstName}
              onChange={changeField}
              maxLength={100}
              required
            />

            <label htmlFor="lastName">Last name</label>
            <input
              id="lastName"
              name="lastName"
              value={form.lastName}
              onChange={changeField}
              maxLength={100}
              required
            />

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

            <label htmlFor="userRole">Role</label>
            <select
              id="userRole"
              name="userRole"
              value={form.userRole}
              onChange={changeField}
              disabled={editingSelf}
            >
              <option value="O">Operator</option>
              <option value="A">Admin</option>
            </select>

            {editingSelf && <p>You cannot change your own Admin role.</p>}

            {editingId === null && (
              <>
                <label htmlFor="staffPassword">Initial password</label>
                <input
                  id="staffPassword"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={changeField}
                  minLength={12}
                  required
                />
                <p>At least 12 characters; maximum 72 UTF-8 bytes.</p>
              </>
            )}

            <div className="user-actions">
              <button type="submit">
                {saving ? 'Saving…' : editingId === null
                  ? 'Create user'
                  : 'Save changes'}
              </button>

              {editingId !== null && (
                <button type="button" onClick={resetForm}>
                  Cancel edit
                </button>
              )}
            </div>
          </fieldset>
        </form>
      </section>

      <section aria-labelledby="staff-list-title">
        <div className="user-list-heading">
          <h2 id="staff-list-title">Staff accounts</h2>
          <button type="button" onClick={reloadUsers} disabled={busy}>
            Refresh list
          </button>
        </div>

        {loading && <p role="status">Loading users…</p>}

        <div className="user-table-container">
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
                  <td>{user.firstName} {user.lastName}</td>
                  <td>{user.username}</td>
                  <td>{user.userRole === 'A' ? 'Admin' : 'Operator'}</td>
                  <td>{user.activeStatus ? 'Active' : 'Inactive'}</td>
                  <td>
                    <div className="user-actions">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => editUser(user)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        disabled={
                          busy ||
                          !user.activeStatus ||
                          user.userId === currentUserId
                        }
                        onClick={() => deactivate(user)}
                      >
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
    </main>
  )
}