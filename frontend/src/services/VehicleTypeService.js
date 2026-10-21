import { API } from '../constants/Api'
import apiClient from './apiClient'

const vehicleTypeEndpoint = '/VehicleType'

function normalizeVehicleType(row) {
  const values = Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key.toLowerCase(), value]),
  )

  return {
    vehicleTypeID: values.vvt_vehicle_type_id,
    typeName: values.vvt_type_name,
    wheelCount: values.vvt_wheel_count,
    description: values.vvt_description ?? '',
    activeStatus: values.vvt_is_active,
  }
}

export async function loadVehicleTypes(params, signal) {
  const response = await apiClient.get(
    `${vehicleTypeEndpoint}/GetVehicleTypes`,
    {
      params: {
        p_includeInactive: params?.includeInactive === true ? '1' : '0',
      },
      signal,
    },
  )

  const data = response.data
  const records = data?.resultSet ?? data?.ResultSet

  if (!Array.isArray(records)) {
    throw new Error('The vehicle type API returned an unexpected response.')
  }

  return records.map(normalizeVehicleType)
}

export async function saveVehicleType(url, data, method) {
  const parts = url
    .slice(API.vehicleTypes.length)
    .split('/')
    .filter(Boolean)

  const vehicleTypeID = parts[0]
    ? decodeURIComponent(parts[0])
    : data?.vehicleTypeID

  let action
  let payload

  if (
    method === 'patch' &&
    ['deactivate', 'reactivate'].includes(parts[1])
  ) {
    action = 'UpdateVehicleTypeStatus'
    payload = {
      p_typeId: vehicleTypeID,
      p_isActive: parts[1] === 'reactivate' ? 'A' : 'I',
    }
  } else if (
    (method === 'post' && parts.length === 0) ||
    (method === 'put' && parts.length === 1)
  ) {
    action = method === 'post'
      ? 'AddVehicleType'
      : 'UpdateVehicleTypeDetails'

    payload = {
      p_typeId: vehicleTypeID,
      p_typeName: data.typeName,
      p_wheelCount: String(data.wheelCount),
      p_description: data.description ?? null,
    }
  } else {
    throw new Error('Unsupported vehicle type operation.')
  }

  const response = await apiClient.post(
    `${vehicleTypeEndpoint}/${action}`,
    payload,
  )

  return response.data
}