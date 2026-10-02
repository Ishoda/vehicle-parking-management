import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { signOut } from '../store/slices/authSlice'
import RoleGate from '../components/RoleGate'
import {
  ADMIN_ROLES,
  FEATURE_PERMISSIONS,
  OPERATION_ROLES,
  ROLES,
  hasRole,
} from '../constants/Permissions'

export default function DashboardPage() {
  const dispatch = useDispatch()
  const { user, loading, error } = useSelector((state) => state.auth)

  const features = FEATURE_PERMISSIONS.filter(
    (feature) => hasRole(user, feature.roles),
  )

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