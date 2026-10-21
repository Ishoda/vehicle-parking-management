import { API } from '../constants/Api'
import apiClient from './apiClient'

export async function loadMonthlyContracts(params, signal) {
  const response = await apiClient.get(
    '/MonthlyContract/GetMonthlyContracts',
    {
      params: {
        p_customerID: params?.customerID == null
          ? undefined
          : String(params.customerID),
        p_searchTerm: params?.searchTerm,
      },
      signal,
    },
  )

  const data = response.data
  const records = data?.resultSet ?? data?.ResultSet

  if (!Array.isArray(records)) {
    throw new Error(
      'The monthly contract API returned an unexpected response.',
    )
  }

  return records.map((row) => {
    const values = Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key.toLowerCase(), value]),
    )

    return {
      contractID: values.vpm_contract_id,
      contractNumber: values.vpm_contract_number,
      customerID: values.vpm_customer_id,
      customerName: values.vpc_customer_name,
      mobileNumber: values.vpc_mobile_number,
      customerVehicleID: values.vpm_vehicle_id,
      vehicleNumber: values.vpv_vehicle_number,
      vehicleTypeID: values.vpv_vehicle_type_id,
      vehicleTypeName: values.vvt_type_name,
      monthlyFee: values.vpm_monthly_fee,
      startDate: values.vpm_start_date,
      endDate: values.vpm_end_date,
      storedStatus: values.vpm_contract_status,
      status: ({
        A: 'ACTIVE',
        U: 'UPCOMING',
        E: 'EXPIRED',
        CN: 'CANCELLED',
      })[
        values.effectivecontractstatus || values.vpm_contract_status
      ] || 'UNKNOWN',
      cancelledReason: values.vpm_cancelled_reason ?? '',
    }
  })
}

export async function saveMonthlyContract(url, data, method) {
  const parts = url
    .slice(API.monthlyContracts.length)
    .split('/')
    .filter(Boolean)

  const creating = method === 'post' && parts.length === 0
  const updating = method === 'put' && parts.length === 1

  if (!creating && !updating) {
    throw new Error('Use Cancel or Expire for monthly contracts.')
  }

  const payload = {
    p_monthlyFee: String(data.monthlyFee),
    p_startDate: data.startDate,
    p_endDate: data.endDate,
  }

  if (creating) {
    payload.p_customerID = String(data.customerID)
    payload.p_vehicleID = String(data.customerVehicleID)
  } else {
    payload.p_contractID = decodeURIComponent(parts[0])
  }

  const response = await apiClient.post(
    creating
      ? '/MonthlyContract/AddMonthlyContract'
      : '/MonthlyContract/UpdateMonthlyContract',
    payload,
  )

  return response.data
}