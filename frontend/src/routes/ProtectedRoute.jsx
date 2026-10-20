import { useSelector } from 'react-redux'
import { Navigate, Outlet } from 'react-router-dom'

import { hasRole } from '../constants/Permissions'

export default function ProtectedRoute({ allowedRoles }) {
  const user = useSelector((state) => state.auth.user)

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !hasRole(user, allowedRoles)) {
    return <Navigate to="/forbidden" replace />
  }

  return <Outlet />
}