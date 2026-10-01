import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { signIn } from '../store/slices/authSlice'
import '../styles/LoginPage.css'

export default function LoginPage() {
  const dispatch = useDispatch()
  const { loading, error } = useSelector((state) => state.auth)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  function handleSubmit(event) {
    event.preventDefault()

    if (loading) return

    dispatch(signIn({
      username: username.trim(),
      password,
    }))

    setPassword('')
    setShowPassword(false)
  }

  return (
    <main className="auth-page">
      <section className="login-card" aria-labelledby="login-title">
        <h1 id="login-title">Parkly</h1>
        

        <p className="auth-description">
          Sign in to your staff account.
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            maxLength={100}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            disabled={loading}
            required
          />

          <label htmlFor="password">Password</label>

          <div className="password-field">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={loading}
              required
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-controls="password"
              disabled={loading}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                <circle cx="12" cy="12" r="3" />
                {showPassword && <path d="M3 3 21 21" />}
              </svg>
            </button>
          </div>

          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Log in'}
          </button>
        </form>
      </section>
    </main>
  )
}