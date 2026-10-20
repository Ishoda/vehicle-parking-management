export const ROLES = {
  ADMIN: 'AD',
  OPERATOR: 'OP',
}

export const ADMIN_ROLES = [ROLES.ADMIN]
export const OPERATION_ROLES = [ROLES.ADMIN, ROLES.OPERATOR]

export const MASTER_DATA_PAGES = [
  {
    path: '/spaces',
    title: 'Parking spaces',
    icon: 'space',
    roles: ADMIN_ROLES,
  },
  {
    path: '/vehicle-types',
    title: 'Vehicle types',
    icon: 'vehicle',
    roles: ADMIN_ROLES,
  },
  {
    path: '/rates',
    title: 'Parking rates',
    icon: 'rate',
    roles: ADMIN_ROLES,
  },
  {
    path: '/customers',
    title: 'Customers',
    icon: 'customer',
    roles: ADMIN_ROLES,
  },
  {
    path: '/users',
    title: 'User management',
    icon: 'users',
    roles: ADMIN_ROLES,
  },
  {
    path: '/monthly-parking',
    title: 'Monthly parking',
    icon: 'calendar',
    roles: ADMIN_ROLES,
  },
]

export const PAGES = [
  {
    path: '/',
    title: 'Dashboard',
    icon: 'dashboard',
    roles: OPERATION_ROLES,
  },
  {
    path: '/master-data',
    title: 'Master data',
    icon: 'grid',
    roles: ADMIN_ROLES,
  },
  {
    path: '/vehicle-entry',
    title: 'Vehicle entry',
    icon: 'entry',
    roles: OPERATION_ROLES,
  },
  {
    path: '/vehicle-exit',
    title: 'Vehicle exit',
    icon: 'exit',
    roles: OPERATION_ROLES,
  },
  {
    path: '/current-parking',
    title: 'Current parking',
    icon: 'vehicle',
    roles: OPERATION_ROLES,
  },
  {
    path: '/space-availability',
    title: 'Space availability',
    icon: 'space',
    roles: OPERATION_ROLES,
  },
  {
    path: '/monthly-payments',
    title: 'Monthly payments',
    icon: 'payment',
    roles: OPERATION_ROLES,
  },
  {
    path: '/payments',
    title: 'Payments & receipts',
    icon: 'receipt',
    roles: OPERATION_ROLES,
  },
  {
    path: '/reports',
    title: 'Reports',
    icon: 'report',
    roles: ADMIN_ROLES,
  },
]

export function hasRole(user, allowedRoles) {
  return Boolean(user && allowedRoles.includes(user.role))
}