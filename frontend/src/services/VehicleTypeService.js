import apiClient from './apiClient'

const URL = '/vehicle-types'

async function request(operation) {
  try {
    const response = await operation()
    return response.data
  } catch (error) {
    const data = error.response?.data

    const validationErrors = data?.errors
      ? Object.values(data.errors).flat().join(' ')
      : ''

    const message =
      validationErrors ||
      data?.result ||
      data?.Result ||
      data?.message ||
      data?.Message ||
      (error.response?.status === 401
        ? 'Your session is unavailable. Please log in again.'
        : error.response?.status === 403
          ? 'You do not have permission to perform this operation.'
          : 'Unable to complete the request.')

    throw new Error(message)
  }
}

export async function getVehicleTypes(includeInactive = false) {
  const data = await request(() =>
    apiClient.get(URL, {
      params: { includeInactive },
    }),
  )

  const rows = Array.isArray(data)
    ? data
    : data?.resultSet ?? data?.ResultSet ?? []

  if (!Array.isArray(rows)) {
    throw new Error('The server returned an invalid vehicle type list.')
  }

  return rows.map((row) => ({
    vehicleTypeID: row.vehicleTypeID ?? row.VehicleTypeID,
    typeName: row.typeName ?? row.TypeName,
    description: row.description ?? row.Description ?? '',
    activeStatus: row.activeStatus ?? row.ActiveStatus,
  }))
}

export function addVehicleType(model) {
  return request(() => apiClient.post(URL, model))
}

export function updateVehicleType(id, model) {
  return request(() => apiClient.put(`${URL}/${id}`, model))
}

export function deactivateVehicleType(id) {
  return request(() => apiClient.patch(`${URL}/${id}/deactivate`))
}

export function reactivateVehicleType(id) {
  return request(() => apiClient.patch(`${URL}/${id}/reactivate`))
}