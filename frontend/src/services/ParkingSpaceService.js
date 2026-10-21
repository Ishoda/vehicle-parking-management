import { API } from '../constants/Api'
import apiClient from './apiClient'

export async function loadSpaces(params, signal) {
  const response = await apiClient.get(
    '/ParkingSpace/GetParkingSpaces',
    {
      params: {
        p_vehicleTypeID: params?.vehicleTypeID,
        p_spaceStatus: params?.spaceStatus,
      },
      signal,
    },
  )

  const data = response.data
  const records = data?.resultSet ?? data?.ResultSet

  if (!Array.isArray(records)) {
    throw new Error('The parking space API returned an unexpected response.')
  }

  return records.map((row) => {
    const values = Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key.toLowerCase(), value]),
    )

    return {
      spaceID: values.vps_space_id,
      vehicleTypeID: values.vps_vehicle_type_id,
      vehicleTypeName: values.vvt_type_name,
      spaceCode: values.vps_space_code,
      spaceName: values.vps_space_name ?? '',
      spaceStatus: values.vps_space_status,
      blockReason: values.vps_block_reason ?? '',
    }
  })
}

export async function saveSpace(url, data, method) {
  const parts = url
    .slice(API.spaces.length)
    .split('/')
    .filter(Boolean)

  const creating = method === 'post' && parts.length === 0
  const updating = method === 'put' && parts.length === 1

  if (!creating && !updating) {
    throw new Error(
      'This backend does not provide a parking space delete endpoint.',
    )
  }

  const response = await apiClient.post(
    creating
      ? '/ParkingSpace/AddParkingSpace'
      : '/ParkingSpace/UpdateParkingSpace',
    {
      p_spaceID: creating
        ? data.spaceID
        : decodeURIComponent(parts[0]),
      p_vehicleTypeID: data.vehicleTypeID,
      p_spaceCode: data.spaceCode,
      p_spaceName: data.spaceName ?? null,
    },
  )

  return response.data
}