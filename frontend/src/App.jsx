import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import LoginPage from './pages/LoginPage'
import {
  restoreSession,
  signOut,
} from './store/slices/authSlice'
import './App.css'

export default function App() {
  const dispatch = useDispatch()

  const {
    user,
    loading,
    error,
    initialized,
    sessionError,
  } = useSelector((state) => state.auth)

  useEffect(() => {
    dispatch(restoreSession())
  }, [dispatch])

  if (!initialized) {
    return (
      <main className="auth-page">
        <h1>Vehicle Parking Management</h1>

        {sessionError ? (
          <>
            <p role="alert">{error}</p>
            <button
              type="button"
              disabled={loading}
              onClick={() => dispatch(restoreSession())}
            >
              Try again
            </button>
          </>
        ) : (
          <p role="status">Checking your session…</p>
        )}
      </main>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  const roleName = {
    A: 'Admin',
    O: 'Operator',
  }[user.role] || 'Unknown'

  return (
    <main className="auth-page">
      <h1>Vehicle Parking Management</h1>

      <p className="auth-description">
        Welcome, {user.firstName} {user.lastName}.
      </p>

      <p>Username: {user.username}</p>
      <p>Role: {roleName}</p>

      {error && <p role="alert">{error}</p>}

      <button
        className="logout-button"
        type="button"
        disabled={loading}
        onClick={() => dispatch(signOut())}
      >
        {loading ? 'Logging out…' : 'Log out'}
      </button>
    </main>
  )
}