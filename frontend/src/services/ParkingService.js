import { API } from '../constants/Api'
import apiClient from './apiClient'

import {
  loadVehicleTypes,
  saveVehicleType,
} from './VehicleTypeService'

import {
  loadSpaces,
  saveSpace,
} from './ParkingSpaceService'

import {
  loadRates,
  saveRate,
} from './ParkingRateService'

import {
  loadCustomers,
  saveCustomer,
} from './CustomerService'

import {
  loadCustomerVehicles,
  saveCustomerVehicle,
} from './CustomerVehicleService'

import {
  loadMonthlyContracts,
  saveMonthlyContract,
} from './MonthlyContractService'

import {
  loadSettings,
  saveSettings,
} from './SettingsService'

import {
  loadEntrySpaces,
  registerEntry,
} from './ParkingEntryService'

import {
  loadCurrentParking,
  lookupExit,
  processExit,
} from './ParkingTicketService'

import {
  loadDashboard,
  loadSpaceAvailability,
} from './DashboardService'

import { loadCollectionReport } from './CollectionReportService'

export async function getData(url, params, signal) {
  if (url === API.dashboard) {
    return loadDashboard(signal)
  }

  if (url === API.availability) {
    return loadSpaceAvailability(signal)
  }

  if (url === API.reports.collection) {
    return loadCollectionReport(params, signal)
  }

  if (url === API.currentParking) {
    return loadCurrentParking(signal)
  }

  if (url === API.exitLookup) {
    return lookupExit(params, signal)
  }
  if (url.startsWith(`${API.entrySpaces}/`)) {
    const vehicleTypeID = decodeURIComponent(
      url.slice(API.entrySpaces.length + 1),
    )

    return loadEntrySpaces(vehicleTypeID, signal)
  }

  if (url === API.settings) {
    return loadSettings(signal)
  }  
  if (url === API.monthlyContracts) {
    return loadMonthlyContracts(params, signal)
  }

  if (url === API.customerVehicles) {
    return loadCustomerVehicles(params, signal)
  }

  if (url === API.customers) {
    return loadCustomers(params, signal)
  }

  if (url === API.rates) {
    return loadRates(params, signal)
  }

  if (url === API.rateVehicleTypes) {
    return loadVehicleTypes(
      { includeInactive: false },
      signal,
    )
  }

  if (url === API.spaces) {
    return loadSpaces(params, signal)
  }

  if (
    url === API.vehicleTypes ||
    url === API.entryVehicleTypes
  ) {
    return loadVehicleTypes(params, signal)
  }

  const response = await apiClient.get(url, {
    params,
    signal,
  })

  return response.data
}

export async function saveData(
  url,
  data,
  method = 'post',
  requestId,
) {
  const normalizedMethod = method.toLowerCase()
  if (
    normalizedMethod === 'post' &&
    (url === API.dailyExit || url === API.monthlyExit)
  ) {
    return processExit(
      data,
      url === API.monthlyExit,
      requestId,
    )
  }

  if (
    normalizedMethod === 'post' &&
    (url === API.dailyEntry || url === API.monthlyEntry)
  ) {
    return registerEntry(
      data,
      url === API.dailyEntry ? 'D' : 'M',
      requestId,
    )
  }

  if (url === API.settings && normalizedMethod === 'put') {
    return saveSettings(data)
  }

  if (
    url === API.monthlyContracts ||
    url.startsWith(`${API.monthlyContracts}/`)
  ) {
    return saveMonthlyContract(
      url,
      data,
      normalizedMethod,
    )
  }

  if (
    url === API.customerVehicles ||
    url.startsWith(`${API.customerVehicles}/`)
  ) {
    return saveCustomerVehicle(
      url,
      data,
      normalizedMethod,
    )
  }

  if (
    url === API.customers ||
    url.startsWith(`${API.customers}/`)
  ) {
    return saveCustomer(url, data, normalizedMethod)
  }

  if (
    url === API.rates ||
    url.startsWith(`${API.rates}/`)
  ) {
    return saveRate(url, data, normalizedMethod)
  }

  if (
    url === API.spaces ||
    url.startsWith(`${API.spaces}/`)
  ) {
    return saveSpace(url, data, normalizedMethod)
  }

  if (
    url === API.vehicleTypes ||
    url.startsWith(`${API.vehicleTypes}/`)
  ) {
    return saveVehicleType(
      url,
      data,
      normalizedMethod,
    )
  }

  const response = await apiClient.request({
    url,
    method: normalizedMethod,
    data,
    headers: requestId
      ? { 'Idempotency-Key': requestId }
      : {},
  })

  return response.data
}