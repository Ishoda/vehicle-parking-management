import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { signIn } from '../store/slices/authSlice'
import { Icon, Notice } from '../components/UI'

export default function LoginPage() {
  const dispatch = useDispatch()
  const { loading, error } = useSelector((state) => state.auth)
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (loading) return

    await dispatch(
      signIn({
        username: form.username.trim(),
        password: form.password,
      }),
    )

    setForm((current) => ({ ...current, password: '' }))
    setShowPassword(false)
  }

  return (
    <main className="login-page">
      <section className="login-story">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            P
          </span>
          <span>
            Parkly
            <small>PARKING MANAGEMENT</small>
          </span>
        </div>

        <div className="login-story-content">
          <span className="story-tag">
            ONE WORKSPACE. EVERY PARKING TASK.
          </span>
          <h1>
            A smoother day.
            <br />
            <span>A smarter space.</span>
          </h1>
          <p>
            From the first arrival to the last departure,
            <br />
            Keep your parking operation moving.
          </p>

          <div className="parking-art" aria-hidden="true">
            <span>P</span>
            <Icon name="vehicle" size={100} />
            <div className="parking-lines" />
          </div>
        </div>

        <small>Built for your daily parking operations.</small>
      </section>

      <section className="login-panel">
        <form
          className="login-form"
          autoComplete="off"
          onSubmit={handleSubmit}
        >
          <span className="login-symbol">
            <Icon name="shield" size={28} />
          </span>
          <p className="eyebrow">WELCOME BACK</p>
          <h2>Sign in to Parkly</h2>
          <Notice error={error} />

          <div className="field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              autoComplete="username"
              required
              maxLength={100}
              disabled={loading}
              value={form.username}
              onChange={(event) =>
                setForm({ ...form, username: event.target.value })
              }
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <div className="password-input">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                disabled={loading}
                value={form.password}
                onChange={(event) =>
                  setForm({ ...form, password: event.target.value })
                }
              />
              <button
                type="button"
                className="password-toggle"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((current) => !current)}
              >
                <Icon name={showPassword ? 'eyeOff' : 'eye'} />
              </button>
            </div>
          </div>

          <button className="primary login-submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
            <Icon name="arrow" size={18} />
          </button>

          <p className="login-help">
            Need access? Contact your system administrator.
          </p>
        </form>
      </section>
    </main>
  )
}