import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Navigate, Route, Routes } from 'react-router-dom'

import { restoreSession } from './store/slices/authSlice'
import { ADMIN_ROLES, OPERATION_ROLES } from './constants/Permissions'
import { RESOURCES } from './constants/Resources'

import ProtectedRoute from './routes/ProtectedRoute'
import DashboardLayout from './components/DashboardLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import MasterDataPage from './pages/MasterDataPage'
import ResourcePage from './pages/ResourcePage'
import CustomersPage from './pages/CustomersPage'
import ParkingListPage from './pages/ParkingListPage'
import VehicleEntryPage from './pages/VehicleEntryPage'
import VehicleExitPage from './pages/VehicleExitPage'
import SpaceAvailabilityPage from './pages/SpaceAvailabilityPage'
import MonthlyPaymentPage from './pages/MonthlyPaymentPage'
import PaymentsPage from './pages/PaymentsPage'
import ReportsPage from './pages/ReportsPage'
import SettingsPage from './pages/SettingsPage'
import NotFoundPage from './pages/NotFoundPage'
import ForbiddenPage from './pages/ForbiddenPage'

export default function App() {
  const dispatch = useDispatch()
  const { user, initialized, loading, error } = useSelector(
    (state) => state.auth,
  )

  useEffect(() => {
    const task = dispatch(restoreSession())
    return () => task.abort()
  }, [dispatch])

  if (!initialized) {
    return (
      <main className="session-screen">
        <span className="brand-mark">P</span>
        <h1>Parkly</h1>
        <p role={error ? 'alert' : 'status'}>
          {error || 'Checking your session…'}
        </p>

        {error && (
          <button
            className="primary"
            disabled={loading}
            onClick={() => dispatch(restoreSession())}
          >
            Try again
          </button>
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
        <Route element={<DashboardLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="vehicle-entry" element={<VehicleEntryPage />} />
          <Route path="vehicle-exit" element={<VehicleExitPage />} />
          <Route
            path="current-parking"
            element={<ParkingListPage key="current" />}
          />
          <Route
            path="space-availability"
            element={<SpaceAvailabilityPage />}
          />
          <Route path="monthly-payments" element={<MonthlyPaymentPage />} />
          <Route path="payments" element={<PaymentsPage />} />

          <Route element={<ProtectedRoute allowedRoles={ADMIN_ROLES} />}>
            <Route path="master-data" element={<MasterDataPage />} />
            <Route
              path="spaces"
              element={
                <ResourcePage key="spaces" config={RESOURCES.spaces} />
              }
            />
            <Route
              path="vehicle-types"
              element={
                <ResourcePage key="types" config={RESOURCES.vehicleTypes} />
              }
            />
            <Route
              path="rates"
              element={
                <ResourcePage key="rates" config={RESOURCES.rates} />
              }
            />
            <Route path="customers" element={<CustomersPage />} />
            <Route
              path="monthly-parking"
              element={
                <ResourcePage
                  key="contracts"
                  config={RESOURCES.monthlyContracts}
                />
              }
            />
            <Route
              path="users"
              element={
                <ResourcePage key="users" config={RESOURCES.users} />
              }
            />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route path="forbidden" element={<ForbiddenPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  )
}