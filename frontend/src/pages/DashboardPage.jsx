import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { signOut } from '../store/slices/authSlice'
import DashboardLayout from '../components/DashboardLayout'
import RoleGate from '../components/RoleGate'
import {
  ADMIN_ROLES,
  FEATURE_PERMISSIONS,
  OPERATION_ROLES,
  ROLES,
  hasRole,
} from '../constants/Permissions'
import '../styles/DashboardPage.css'

export default function DashboardPage() {
  const dispatch = useDispatch()
  const { user, loading, error } = useSelector((state) => state.auth)

  if (!user) return null

  const features = FEATURE_PERMISSIONS.filter(
    (feature) => hasRole(user, feature.roles),
  )

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

  return (
    <DashboardLayout>
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-eyebrow">Workspace / Overview</p>
            <h1>Dashboard</h1>
          </div>

          <span className="dashboard-role-badge">{roleLabel}</span>
        </header>

        {error && (
          <p className="dashboard-error" role="alert">
            {error}
          </p>
        )}

        <section
          className="dashboard-welcome"
          aria-labelledby="dashboard-welcome-title"
        >
          <div>
            <p className="dashboard-eyebrow">Vehicle Parking Management</p>
            <h2 id="dashboard-welcome-title">Welcome, {fullName}.</h2>
            <p>
              Access your parking tools and manage your daily work
              from one place.
            </p>
          </div>

          <div className="dashboard-access-summary">
            <strong>{features.length}</strong>
            <span>Permitted features</span>
          </div>
        </section>

        <section
          className="dashboard-section"
          aria-labelledby="dashboard-actions-title"
        >
          <div className="dashboard-section-heading">
            <div>
              <h2 id="dashboard-actions-title">Quick access</h2>
              <p>Open the tools available to your account.</p>
            </div>
          </div>

          <div className="dashboard-action-grid">
            <RoleGate allowedRoles={OPERATION_ROLES}>
              <Link
                to="/space-availability"
                className="dashboard-action-card"
              >
                <span className="dashboard-action-icon" aria-hidden="true">
                  P
                </span>
                <h3>Space availability</h3>
                <p>View parking spaces and their current availability.</p>
                <span className="dashboard-action-label">
                  View spaces <span aria-hidden="true">→</span>
                </span>
              </Link>
            </RoleGate>

            <RoleGate allowedRoles={ADMIN_ROLES}>
              <Link to="/users" className="dashboard-action-card">
                <span className="dashboard-action-icon" aria-hidden="true">
                  ◎
                </span>
                <h3>User management</h3>
                <p>Manage staff accounts and their access to the system.</p>
                <span className="dashboard-action-label">
                  Manage users <span aria-hidden="true">→</span>
                </span>
              </Link>
            </RoleGate>
          </div>
        </section>

        <section
          className="dashboard-panel"
          aria-labelledby="dashboard-features-title"
        >
          <div className="dashboard-section-heading">
            <div>
              <h2 id="dashboard-features-title">Your permitted features</h2>
              <p>Features assigned to your current role.</p>
            </div>

            <span className="dashboard-count">{features.length}</span>
          </div>

          {features.length > 0 ? (
            <ul className="dashboard-feature-list">
              {features.map((feature) => (
                <li key={feature.id}>
                  <span
                    className="dashboard-feature-check"
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                  <span>{feature.label}</span>
                  <span className="dashboard-feature-status">Allowed</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="dashboard-empty">
              No features are currently assigned to your account.
            </p>
          )}
        </section>

        <section
          className="dashboard-access-panel"
          aria-labelledby="dashboard-access-title"
        >
          <div>
            <h2 id="dashboard-access-title">Access verification</h2>
            <p>Check access to your role’s protected pages.</p>
          </div>

          <nav
            className="dashboard-access-links"
            aria-label="Permission checks"
          >
            <RoleGate allowedRoles={ADMIN_ROLES}>
              <Link to="/access/admin">Administrator access →</Link>
            </RoleGate>

            <RoleGate allowedRoles={OPERATION_ROLES}>
              <Link to="/access/operations">Operations access →</Link>
            </RoleGate>
          </nav>
        </section>

        <footer className="dashboard-footer">
          Vehicle Parking Management · Staff workspace
        </footer>
      </main>
    </DashboardLayout>
  const navigate = useNavigate();

  return (
    <main className="auth-page">
      <h1>Vehicle Parking Management</h1>

      <p className="auth-description">
        Welcome, {user.firstName} {user.lastName}.
      </p>

      <p>
        Role: {user.role === ROLES.ADMIN ? 'Admin' : 'Operator'}
      </p>

      <h2>Your permitted features</h2>

      <ul>
        {features.map((feature) => (
          <li key={feature.id}>{feature.label}</li>
        ))}
      </ul>

      <button
        type="button"
        className="add-vehicle-type-button"
        onClick={() => navigate("/vehicle-types")}
      >
        + Add New Vehicle Type
      </button>

      <nav className="permission-links" aria-label="Permission checks">
        <RoleGate allowedRoles={ADMIN_ROLES}>
          <Link to="/users">Manage users</Link>
          <Link to="/access/admin">Check administrator access</Link>
        </RoleGate>

        <RoleGate allowedRoles={OPERATION_ROLES}>
          <Link to="/access/operations">Check parking operations access</Link>
        </RoleGate>
      </nav>

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