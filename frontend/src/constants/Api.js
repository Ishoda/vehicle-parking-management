export const API = {
  login: '/UserLogin/Login',
  currentUser: '/UserLogin/Me',
  logout: '/UserLogin/Logout',
  dashboard: '/Dashboard',

  availability: '/SpaceAvailability',
  currentParking: '/CurrentParking',

  vehicleTypes: '/vehicle-types',
  users: '/Users',
  spaces: '/Spaces',
  rates: '/Rates',
  rateVehicleTypes: '/Rates/VehicleTypes',

  customers: '/Customers',
  customerVehicles: '/CustomerVehicles',
  monthlyContracts: '/MonthlyContracts',

  entryVehicleTypes: '/VehicleEntry/VehicleTypes',
  entrySpaces: '/VehicleEntry/AvailableSpaces',
  dailyEntry: '/VehicleEntry/Daily',
  monthlyEntry: '/VehicleEntry/Monthly',

  exitLookup: '/VehicleExit/Lookup',
  dailyExit: '/VehicleExit/Daily',
  monthlyExit: '/VehicleExit/Monthly',

  monthlyPaymentLookup: '/MonthlyPayments/Contracts',
  monthlyPayments: '/MonthlyPayments',
  payments: '/Payments',
  receipts: '/Receipts',

  reports: {
    collection: '/Reports/DailyCollection',
    vehicles: '/Reports/Vehicles',
    monthly: '/Reports/MonthlyCustomers',
  },

  settings: '/Settings',
}