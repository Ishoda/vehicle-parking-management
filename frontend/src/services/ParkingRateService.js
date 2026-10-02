import apiClient from './apiClient'

export async function getRates(signal) {
  const response = await apiClient.get('/Rates', { signal })
  return response.data
}

export async function getRateVehicleTypes(signal) {
  const response = await apiClient.get('/Rates/VehicleTypes', { signal })
  return response.data
}

export async function createRate(request) {
  const response = await apiClient.post('/Rates', request)
  return response.data
}

export async function updateRate(rateId, request) {
  const response = await apiClient.put(`/Rates/${rateId}`, request)
  return response.data
}

export async function getApplicableRates(vehicleTypeId, signal) {
  const response = await apiClient.get(
    `/Rates/Applicable/${vehicleTypeId}`,
    { signal },
  )

  return response.data
}