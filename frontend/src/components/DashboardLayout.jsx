import { useDispatch, useSelector } from 'react-redux'
import { Link, NavLink } from 'react-router-dom'
import { signOut } from '../store/slices/authSlice'
import RoleGate from './RoleGate'
import {
  ADMIN_ROLES,
  OPERATION_ROLES,
  ROLES,
} from '../constants/Permissions'
import '../styles/DashboardPage.css'

export default function DashboardLayout({ children }) {
  const dispatch = useDispatch()
  const { user, loading } = useSelector((state) => state.auth)

  if (!user) return null

  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(' ') ||
    user.username ||
    'Staff member'

  const initials =
    [user.firstName, user.lastName]
      .filter(Boolean)
      .map((name) => name.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase() ||
    fullName.charAt(0).toUpperCase()

  const roleLabel = user.role === ROLES.ADMIN ? 'Admin' : 'Operator'

  function navClass({ isActive }) {
    return `dashboard-nav-link${isActive ? ' is-active' : ''}`
  }

  return (
    <div className="parking-dashboard">
      <aside className="dashboard-sidebar">
        <Link to="/" className="dashboard-brand">
          <span className="dashboard-brand-mark" aria-hidden="true">
            P
          </span>

          <span>
            <strong>Parking Management</strong>
            <small>Staff workspace</small>
          </span>
        </Link>

        <div className="dashboard-nav-group">
          <p className="dashboard-nav-label">Workspace</p>

          <nav className="dashboard-nav" aria-label="Main navigation">
            <NavLink to="/" end className={navClass}>
              <span aria-hidden="true">▦</span>
              Overview
            </NavLink>

            <RoleGate allowedRoles={OPERATION_ROLES}>
              <NavLink to="/space-availability" className={navClass}>
                <span aria-hidden="true">P</span>
                Space availability
              </NavLink>
            </RoleGate>

            <RoleGate allowedRoles={ADMIN_ROLES}>
              <NavLink to="/users" className={navClass}>
                <span aria-hidden="true">◎</span>
                User management
              </NavLink>
            </RoleGate>
          </nav>
        </div>

        <div className="dashboard-sidebar-footer">
          <div className="dashboard-profile">
            <span className="dashboard-avatar" aria-hidden="true">
              {initials}
            </span>

            <div className="dashboard-profile-details">
              <strong>{fullName}</strong>
              <span>{roleLabel} account</span>
            </div>
          </div>

          <button
            className="dashboard-logout"
            type="button"
            disabled={loading}
            onClick={() => dispatch(signOut())}
          >
            {loading ? 'Logging out…' : 'Log out'}
          </button>
        </div>
      </aside>

      {children}
    </div>
  )
}