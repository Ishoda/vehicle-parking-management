import apiClient from './apiClient'

export async function getEntryVehicleTypes(signal) {
  const response = await apiClient.get(
    '/VehicleEntry/VehicleTypes',
    { signal },
  )

  return response.data
}

export async function getEntrySpaces(vehicleTypeId, signal) {
  const response = await apiClient.get(
    `/VehicleEntry/AvailableSpaces/${vehicleTypeId}`,
    { signal },
  )

  return response.data
}

export async function createDailyEntry(request) {
  const response = await apiClient.post('/VehicleEntry/Daily', request)
  return response.data
}

export async function createMonthlyEntry(request) {
  const response = await apiClient.post('/VehicleEntry/Monthly', request)
  return response.data
}