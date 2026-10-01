import { useSelector } from 'react-redux'
import { hasRole } from '../constants/Permissions'

export default function RoleGate({ allowedRoles, children }) {
  const user = useSelector((state) => state.auth.user)

  return hasRole(user, allowedRoles) ? children : null
}