import { useSelector } from 'react-redux'
import { Navigate, Outlet } from 'react-router-dom'
import { hasRole } from '../constants/Permissions'

export default function ProtectedRoute({ allowedRoles }) {
  const { user, initialized } = useSelector((state) => state.auth)

  if (!initialized) {
    return <p role="status">Checking your session…</p>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !hasRole(user, allowedRoles)) {
    return <Navigate to="/forbidden" replace />
  }

  return <Outlet />
}