import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Settings } from 'lucide-react'

import { PAGES, hasRole } from '../constants/Permissions'
import { signOut } from '../store/slices/authSlice'
import { Icon, Notice } from './UI'

export default function DashboardLayout() {
  const dispatch = useDispatch()
  const { user, loading, error } = useSelector((state) => state.auth)
  const [menuOpen, setMenuOpen] = useState(false)
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    function updateConnection() {
      setOnline(navigator.onLine)
    }

    window.addEventListener('online', updateConnection)
    window.addEventListener('offline', updateConnection)

    return () => {
      window.removeEventListener('online', updateConnection)
      window.removeEventListener('offline', updateConnection)
    }
  }, [])

  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(' ') ||
    user.username ||
    'Staff member'

  const pages = PAGES.filter((page) => hasRole(user, page.roles))

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      {menuOpen && (
        <button
          type="button"
          className="nav-overlay"
          aria-label="Close navigation"
          onClick={closeMenu}
        />
      )}

      <aside
        id="sidebar"
        className={`sidebar ${menuOpen ? 'open' : ''}`}
      >
        <Link to="/" className="brand" onClick={closeMenu}>
          <span className="brand-mark" aria-hidden="true">
            P
          </span>
          <span>
            Parkly
            <small>PARKING MANAGEMENT</small>
          </span>
        </Link>

        <p className="nav-label">YOUR WORKSPACE</p>

        <nav aria-label="Main navigation">
          {pages.map((page) => (
            <NavLink
              key={page.path}
              to={page.path}
              end={page.path === '/'}
              onClick={closeMenu}
            >
              <Icon name={page.icon} size={19} />
              <span>{page.title}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="profile">
            <span className="avatar">
              {fullName.charAt(0).toUpperCase()}
            </span>
            <div>
              <strong>{fullName}</strong>
              <small>
                {user.role === 'AD' ? 'Owner / Admin' : 'Parking Operator'}
              </small>
            </div>
          </div>

          <div className="sidebar-account-actions">
            <button
              type="button"
              className="sidebar-account-action"
              disabled={loading}
              onClick={() => dispatch(signOut())}
            >
              <Icon name="exit" size={18} />
              <span>{loading ? 'Signing out…' : 'Sign out'}</span>
            </button>

            {user.role === 'AD' && (
              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  `sidebar-account-action ${isActive ? 'active' : ''}`
                }
                onClick={closeMenu}
              >
                <Settings size={18} aria-hidden="true" />
                <span>Settings</span>
              </NavLink>
            )}
          </div>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <button
            type="button"
            className="menu-button secondary"
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
            aria-controls="sidebar"
            onClick={() => setMenuOpen((current) => !current)}
          >
            <Icon name="menu" />
          </button>

          <span className="topbar-title">Parking, made simple.</span>

          <div className="topbar-right">
            <span className={`connection ${online ? '' : 'offline'}`}>
              {online ? 'Online' : 'Offline'}
            </span>
            <span className="role-pill">
              {user.role === 'AD' ? 'Admin' : 'Operator'}
            </span>
          </div>
        </header>

        <main id="main" className="main-content">
          <Notice error={error} />

          {!online && (
            <div className="notice warning" role="status">
              You are offline. Displayed information may be outdated.
              Entries, exits and payments require a connection.
            </div>
          )}

          <Outlet />
        </main>

        <footer className="app-footer">
          Parkly · Vehicle Parking Management
          <span>Staff workspace</span>
        </footer>
      </div>
    </div>
  )
}