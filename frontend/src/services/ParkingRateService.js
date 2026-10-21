import { API } from '../constants/Api'
import apiClient from './apiClient'

export async function loadRates(params, signal) {
  const response = await apiClient.get(
    '/ParkingRate/GetParkingRates',
    {
      params: {
        p_includeInactive: '1',
        p_vehicleTypeID: params?.vehicleTypeID,
      },
      signal,
    },
  )

  const data = response.data
  const records = data?.resultSet ?? data?.ResultSet

  if (!Array.isArray(records)) {
    throw new Error('The parking rate API returned an unexpected response.')
  }

  return records.map((row) => {
    const values = Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key.toLowerCase(), value]),
    )

    return {
      rateID: values.vpr_rate_id,
      vehicleTypeID: values.vpr_vehicle_type_id,
      vehicleTypeName: values.vvt_type_name,
      rateName: values.vpr_rate_name,
      rateAmount: values.vpr_rate_amount,
      rateUnit: values.vpr_rate_unit,
      effectiveFrom: values.vpr_effective_from,
      effectiveTo: values.vpr_effective_to,
      activeStatus: values.vpr_is_active,
    }
  })
}

export async function saveRate(url, data, method) {
  const parts = url
    .slice(API.rates.length)
    .split('/')
    .filter(Boolean)

  const rateID = parts[0]
    ? decodeURIComponent(parts[0])
    : data?.rateID

  let action
  let payload

  if (
    method === 'patch' &&
    parts.length === 2 &&
    ['deactivate', 'reactivate'].includes(parts[1])
  ) {
    action = 'UpdateParkingRateStatus'
    payload = {
      p_rateID: rateID,
      p_isActive: parts[1] === 'reactivate' ? 'A' : 'I',
    }
  } else if (
    (method === 'post' && parts.length === 0) ||
    (method === 'put' && parts.length === 1)
  ) {
    const creating = method === 'post'

    action = creating ? 'AddParkingRate' : 'UpdateParkingRate'
    payload = {
      p_rateID: rateID,
      p_rateName: data.rateName,
      p_rateAmount: String(data.rateAmount),

      // ResourcePage already converts these to UTC.
      // SQL stores UTC in DATETIME2 without a suffix.
      p_effectiveFrom: data.effectiveFrom
        ? data.effectiveFrom.slice(0, 19)
        : null,
      p_effectiveTo: data.effectiveTo
        ? data.effectiveTo.slice(0, 19)
        : null,
    }

    if (creating) {
      payload.p_vehicleTypeID = data.vehicleTypeID
      payload.p_rateUnit = data.rateUnit
      payload.p_isActive = 'A'
    }
  } else {
    throw new Error('Unsupported parking rate operation.')
  }

  const response = await apiClient.post(
    `/ParkingRate/${action}`,
    payload,
  )

  return response.data
}