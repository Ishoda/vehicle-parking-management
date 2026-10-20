import { API } from './Api'
import { dateOnly, dateTime, money, today } from '../utils/format'

function text(name, label, required = true) {
  return { name, label, required }
}

function amount(name, label) {
  return {
    name,
    label,
    required: true,
    numeric: true,
    type: 'number',
    min: 0,
    step: '0.01',
  }
}

function date(name, label) {
  return { name, label, type: 'date', required: true }
}

function choices(name, label, values) {
  return {
    name,
    label,
    required: true,
    options: values.map((value) => ({ value, label: value })),
  }
}

function column(key, label, render) {
  return { key, label, render }
}

export const vehicleTypeField = {
  name: 'vehicleTypeID',
  label: 'Vehicle type',
  required: true,
  url: API.entryVehicleTypes,
  valueKey: 'vehicleTypeID',
  labelKey: 'typeName',
}

export const RESOURCES = {
  spaces: {
    title: 'Parking spaces',
    url: API.spaces,
    id: 'spaceID',
    fields: [
      {
        ...text('spaceID', 'Space ID'),
        createOnly: true,
        maxLength: 10,
        help: 'Unique internal ID, maximum 10 characters.',
      },
      {
        ...text('spaceCode', 'Space code'),
        uppercase: true,
        maxLength: 30,
      },
      {
        ...text('spaceName', 'Space name', false),
        maxLength: 100,
      },
      vehicleTypeField,
    ],
    columns: [
      column('spaceID', 'Space ID'),
      column('spaceCode', 'Space code'),
      column('spaceName', 'Name'),
      column('vehicleTypeName', 'Vehicle type'),
      column('spaceStatus', 'Status'),
      column('blockReason', 'Block reason'),
    ],
    canEdit: (row) =>
      ['AV', 'B', 'AVAILABLE', 'BLOCKED'].includes(row.spaceStatus),
  },

  vehicleTypes: {
    title: 'Vehicle types',
    url: API.vehicleTypes,
    id: 'vehicleTypeID',
    params: { includeInactive: true },
    fields: [
      {
        ...text('vehicleTypeID', 'Vehicle type ID'),
        createOnly: true,
        maxLength: 10,
        help: 'Unique internal ID, maximum 10 characters.',
      },
      {
        ...text('typeName', 'Type name'),
        maxLength: 100,
      },
      {
        name: 'wheelCount',
        label: 'Wheel count',
        required: true,
        numeric: true,
        type: 'number',
        min: 1,
        step: 1,
      },
      {
        ...text('description', 'Description', false),
        type: 'textarea',
        maxLength: 500,
        wide: true,
      },
    ],
    columns: [
      column('vehicleTypeID', 'Vehicle type ID'),
      column('typeName', 'Vehicle type'),
      column('wheelCount', 'Wheels'),
      column('description', 'Description'),
      column('activeStatus', 'Status'),
    ],
    toggle: true,
  },

  rates: {
    title: 'Parking rates',
    url: API.rates,
    id: 'rateID',
    defaults: { rateUnit: 'HOURLY' },
    fields: [
      { ...vehicleTypeField, url: API.rateVehicleTypes },
      text('rateName', 'Rate name'),
      amount('rateAmount', 'Amount (LKR)'),
      choices('rateUnit', 'Rate unit', ['HOURLY', 'DAILY']),
      {
        name: 'effectiveFrom',
        label: 'Effective from',
        type: 'datetime-local',
        required: true,
      },
      {
        name: 'effectiveTo',
        label: 'Effective to',
        type: 'datetime-local',
      },
    ],
    columns: [
      column('vehicleTypeID', 'Vehicle type ID'),
      column('rateName', 'Rate'),
      column('rateUnit', 'Unit'),
      column('rateAmount', 'Amount', money),
      column('effectiveFrom', 'Effective from', dateTime),
      column('effectiveTo', 'Effective to', dateTime),
      column('activeStatus', 'Status'),
    ],
  },

  customers: {
    title: 'Customers',
    url: API.customers,
    id: 'customerID',
    fields: [
      {
        ...text('customerName', 'Customer name'),
        maxLength: 200,
      },
      {
        ...text('mobileNumber', 'Mobile number'),
        type: 'tel',
        minLength: 10,
        maxLength: 10,
        pattern: '[0-9]{10}',
        help: 'Enter exactly 10 digits.',
      },
      {
        ...text('email', 'Email', false),
        type: 'email',
      },
      {
        ...text('address', 'Address', false),
        type: 'textarea',
        wide: true,
      },
    ],
    columns: [
      column('customerName', 'Name'),
      column('mobileNumber', 'Mobile'),
      column('email', 'Email'),
      column('address', 'Address'),
    ],
  },

  customerVehicles: {
    title: 'Registered vehicles',
    description: 'Register vehicles against the selected customer.',
    url: API.customerVehicles,
    id: 'customerVehicleID',
    fields: [
      {
        ...text('vehicleNumber', 'Vehicle number'),
        uppercase: true,
        pattern: '[A-Z0-9 -]+',
        maxLength: 30,
      },
      vehicleTypeField,
    ],
    columns: [
      column('vehicleNumber', 'Vehicle'),
      column('vehicleTypeName', 'Vehicle type'),
    ],
  },

  monthlyContracts: {
    title: 'Monthly parking',
    url: API.monthlyContracts,
    id: 'contractID',
    defaults: { status: 'ACTIVE' },
    fields: [
      {
        name: 'customerID',
        label: 'Customer',
        required: true,
        // Confirm the customer ID type with the backend.
        numeric: true,
        url: API.customers,
        valueKey: 'customerID',
        labelKey: 'customerName',
      },
      {
        name: 'customerVehicleID',
        label: 'Registered vehicle',
        required: true,
        url: API.customerVehicles,
        valueKey: 'customerVehicleID',
        labelKey: 'vehicleLabel',
        dependsOn: 'customerID',
      },
      amount('monthlyFee', 'Monthly fee (LKR)'),
      {
        ...date('startDate', 'Start date'),
        get min() {
          return today()
        },
      },
      date('endDate', 'End date'),
      choices('status', 'Status', ['ACTIVE', 'EXPIRED', 'CANCELLED']),
    ],
    columns: [
      column('contractNumber', 'Contract'),
      column('customerName', 'Customer'),
      column('mobileNumber', 'Mobile'),
      column('vehicleNumber', 'Vehicle'),
      column('monthlyFee', 'Monthly fee', money),
      column('startDate', 'Start', dateOnly),
      column('endDate', 'End', dateOnly),
      column('status', 'Status'),
      column('paymentStatus', 'Payment'),
    ],
  },

  users: {
    title: 'User management',
    url: API.users,
    id: 'userId',
    defaults: { userRole: 'OP' },
    fields: [
      {
        ...text('firstName', 'First name'),
        maxLength: 100,
      },
      {
        ...text('lastName', 'Last name'),
        maxLength: 100,
      },
      {
        ...text('username', 'Username'),
        maxLength: 100,
      },
      {
        name: 'userRole',
        label: 'Role',
        required: true,
        options: [
          { value: 'OP', label: 'Operator' },
          { value: 'AD', label: 'Owner / Admin' },
        ],
      },
      {
        name: 'password',
        label: 'Initial password',
        type: 'password',
        required: true,
        createOnly: true,
        minLength: 8,
        help: 'At least 8 characters.',
      },
    ],
    columns: [
      column('firstName', 'First name'),
      column('lastName', 'Last name'),
      column('username', 'Username'),
      column('userRole', 'Role', (value) => {
        if (value === 'AD') return 'Admin'
        if (value === 'OP') return 'Operator'
        return value || 'Unknown'
      }),
      column('activeStatus', 'Status'),
    ],
    deactivate: true,
  },
}