import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
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
  const { user, error } = useSelector((state) => state.auth)

  if (!user) return null

  const features = FEATURE_PERMISSIONS.filter(
    (feature) => hasRole(user, feature.roles),
  )

  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(' ') ||
    user.username ||
    'Staff member'

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

            <h2 id="dashboard-welcome-title">
              Welcome, {fullName}.
            </h2>

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
                <span
                  className="dashboard-action-icon"
                  aria-hidden="true"
                >
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
                <span
                  className="dashboard-action-icon"
                  aria-hidden="true"
                >
                  ◎
                </span>

                <h3>User management</h3>
                <p>Manage staff accounts and their access to the system.</p>

                <span className="dashboard-action-label">
                  Manage users <span aria-hidden="true">→</span>
                </span>
              </Link>

              <Link
                to="/vehicle-types"
                className="dashboard-action-card"
              >
                <span
                  className="dashboard-action-icon"
                  aria-hidden="true"
                >
                  V
                </span>

                <h3>Vehicle types</h3>
                <p>Manage vehicle types used for parking spaces and rates.</p>

                <span className="dashboard-action-label">
                  Manage vehicle types <span aria-hidden="true">→</span>
                </span>
              </Link>

              <Link to="/rates" className="dashboard-action-card">
                <span
                  className="dashboard-action-icon"
                  aria-hidden="true"
                >
                  R
                </span>

                <h3>Parking rates</h3>
                <p>Create and update hourly and daily parking rates.</p>

                <span className="dashboard-action-label">
                  Manage rates <span aria-hidden="true">→</span>
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
              <h2 id="dashboard-features-title">
                Your permitted features
              </h2>

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

                  <span className="dashboard-feature-status">
                    Allowed
                  </span>
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
              <Link to="/access/admin">
                Administrator access →
              </Link>
            </RoleGate>

            <RoleGate allowedRoles={OPERATION_ROLES}>
              <Link to="/access/operations">
                Operations access →
              </Link>
            </RoleGate>
          </nav>
        </section>

        <footer className="dashboard-footer">
          Vehicle Parking Management · Staff workspace
        </footer>
      </main>
    </DashboardLayout>
  )
}