export const ROLES = {
  ADMIN: 'A',
  OPERATOR: 'O',
}

export const ADMIN_ROLES = [ROLES.ADMIN]

export const OPERATION_ROLES = [
  ROLES.ADMIN,
  ROLES.OPERATOR,
]

export const FEATURE_PERMISSIONS = [
  {
    id: 'spaces',
    label: 'Manage spaces',
    roles: ADMIN_ROLES,
  },
  {
    id: 'rates',
    label: 'Manage rates',
    roles: ADMIN_ROLES,
  },
  {
    id: 'customers',
    label: 'Manage customers',
    roles: ADMIN_ROLES,
  },
  {
    id: 'monthly-parking',
    label: 'Manage monthly parking',
    roles: ADMIN_ROLES,
  },
  {
    id: 'reports',
    label: 'Reports',
    roles: ADMIN_ROLES,
  },
  {
    id: 'users',
    label: 'Manage users',
    roles: ADMIN_ROLES,
  },
  {
    id: 'entries',
    label: 'Vehicle entries',
    roles: OPERATION_ROLES,
  },
  {
    id: 'exits',
    label: 'Vehicle exits',
    roles: OPERATION_ROLES,
  },
  {
    id: 'payments',
    label: 'Payments',
    roles: OPERATION_ROLES,
  },
  {
    id: 'current-parking',
    label: 'Current parking',
    roles: OPERATION_ROLES,
  },
  {
    id: 'receipts',
    label: 'Receipts',
    roles: OPERATION_ROLES,
  },
]

export function hasRole(user, allowedRoles) {
  return Boolean(user && allowedRoles.includes(user.role))
}