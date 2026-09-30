import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { signIn } from '../store/slices/authSlice'

export default function LoginPage() {
  const dispatch = useDispatch()
  const { loading, error } = useSelector((state) => state.auth)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(event) {
    event.preventDefault()

    if (loading) return

    dispatch(signIn({
      username: username.trim(),
      password,
    }))

    setPassword('')
  }

  return (
    <main className="auth-page">
      <h1>Vehicle Parking Management</h1>
      <p className="auth-description">Sign in to your staff account.</p>

      <form onSubmit={handleSubmit}>
        <label htmlFor="username">Username</label>
        <input
          id="username"
          name="username"
          autoComplete="username"
          maxLength={100}
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          disabled={loading}
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={loading}
          required
        />

        {error && <p role="alert">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Signing in…' : 'Log in'}
        </button>
      </form>
    </main>
  )
}