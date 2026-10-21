import { API } from '../constants/Api'
import apiClient from './apiClient'

export async function loadCustomerVehicles(params, signal) {
  const response = await apiClient.get(
    '/CustomerVehicle/GetVehicles',
    {
      params: {
        p_customerId: params?.customerID == null
          ? undefined
          : String(params.customerID),
        p_includeInactive: params?.includeInactive === true ? '1' : '0',
        p_searchTerm: params?.searchTerm,
      },
      signal,
    },
  )

  const data = response.data
  const records = data?.resultSet ?? data?.ResultSet

  if (!Array.isArray(records)) {
    throw new Error(
      'The registered vehicle API returned an unexpected response.',
    )
  }

  return records.map((row) => {
    const values = Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key.toLowerCase(), value]),
    )

    const vehicleNumber = values.vpv_vehicle_number
    const vehicleTypeName = values.vvt_type_name

    return {
      customerVehicleID: values.vpv_vehicle_id,
      customerID: values.vpv_customer_id,
      vehicleNumber,
      vehicleTypeID: values.vpv_vehicle_type_id,
      vehicleTypeName,
      vehicleLabel: `${vehicleNumber} (${vehicleTypeName || 'Vehicle'})`,
      vehicleMake: values.vpv_vehicle_make ?? '',
      vehicleModel: values.vpv_vehicle_model ?? '',
      vehicleColour: values.vpv_vehicle_color ?? '',
      activeStatus: values.vpv_is_active,
    }
  })
}

export async function saveCustomerVehicle(url, data, method) {
  const parts = url
    .slice(API.customerVehicles.length)
    .split('/')
    .filter(Boolean)

  const vehicleID = parts[0]
    ? decodeURIComponent(parts[0])
    : data?.customerVehicleID

  let action
  let payload

  if (
    method === 'patch' &&
    parts.length === 2 &&
    ['deactivate', 'reactivate'].includes(parts[1])
  ) {
    action = 'UpdateVehicleStatus'
    payload = {
      p_vehicleId: vehicleID,
      p_isActive: parts[1] === 'reactivate' ? 'A' : 'I',
    }
  } else if (
    (method === 'post' && parts.length === 0) ||
    (method === 'put' && parts.length === 1)
  ) {
    const creating = method === 'post'

    action = creating ? 'AddVehicle' : 'UpdateVehicleDetails'
    payload = {
      p_vehicleId: vehicleID,
      p_customerId: String(data.customerID),
      p_vehicleTypeId: data.vehicleTypeID,
      p_vehicleNumber: data.vehicleNumber,
      p_vehicleMake: data.vehicleMake || null,
      p_vehicleModel: data.vehicleModel || null,
      p_vehicleColour: data.vehicleColour || null,
    }

    if (creating) {
      payload.p_isActive = 'A'
    }
  } else {
    throw new Error('Unsupported registered vehicle operation.')
  }

  const response = await apiClient.post(
    `/CustomerVehicle/${action}`,
    payload,
  )

  return response.data
}