import apiClient from './apiClient'

export async function loadSettings(signal) {
  const response = await apiClient.post(
    '/Settings/GetSettings',
    {},
    { signal },
  )

  const data = response.data
  const record = data?.resultSet ?? data?.ResultSet

  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    throw new Error('The settings API returned an unexpected response.')
  }

  const values = Object.fromEntries(
    Object.entries(record).map(([key, value]) => [
      key.toLowerCase(),
      value,
    ]),
  )

  return {
    facilityName: values.vps_facility_name ?? '',
    address: values.vps_address ?? '',
    contactNumber: values.vps_contact_number ?? '',
    receiptMessage: values.vps_receipt_message ?? '',
    dailyThresholdHours: values.vps_daily_threshold_hours ?? 6,
    monthlyCapacityPercentage:
      values.vps_monthly_capacity_percentage ?? '',
    isActive: values.vps_is_active ?? 'A',
  }
}

export async function saveSettings(data) {
  const response = await apiClient.post(
    '/Settings/SaveSettings',
    {
      p_facilityName: data.facilityName,
      p_address: data.address || null,
      p_contactNumber: data.contactNumber || null,
      p_receiptMessage: data.receiptMessage,
      p_dailyThresholdHours: Number(data.dailyThresholdHours),
      p_monthlyCapacityPercentage:
        data.monthlyCapacityPercentage == null ||
        data.monthlyCapacityPercentage === ''
          ? null
          : Number(data.monthlyCapacityPercentage),
      p_isActive: data.isActive,
    },
  )

  return response.data
}