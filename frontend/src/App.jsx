import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Navigate, Route, Routes } from 'react-router-dom'
import { restoreSession } from './store/slices/authSlice'
import { ADMIN_ROLES, OPERATION_ROLES } from './constants/Permissions'
import ProtectedRoute from './routes/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import AccessCheckPage from './pages/AccessCheckPage'
import ForbiddenPage from './pages/ForbiddenPage'
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

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <LoginPage />}
      />

      <Route element={<ProtectedRoute allowedRoles={OPERATION_ROLES} />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/forbidden" element={<ForbiddenPage />} />

        <Route
          path="/access/operations"
          element={
            <AccessCheckPage
              key="operations"
              title="Parking operations access"
              endpoint="/Permissions/Operations"
            />
          }
        />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={ADMIN_ROLES} />}>
        <Route
          path="/access/admin"
          element={
            <AccessCheckPage
              key="admin"
              title="Administrator access"
              endpoint="/Permissions/Admin"
            />
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}