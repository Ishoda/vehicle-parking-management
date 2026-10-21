import { API } from '../constants/Api'
import apiClient from './apiClient'

export async function loadCustomers(params, signal) {
  const response = await apiClient.get(
    API.customers,
    { params, signal },
  )

  if (!Array.isArray(response.data)) {
    throw new Error('The customer API returned an unexpected response.')
  }

  return response.data.map((row) => ({
    customerID: row.customerID,
    customerName: row.customerName,
    mobileNumber: row.mobileNumber,
    email: row.emailAddress ?? '',
    address: row.address ?? '',
    activeStatus: row.isActive,
  }))
}

export async function saveCustomer(url, data, method) {
  const parts = url
    .slice(API.customers.length)
    .split('/')
    .filter(Boolean)

  if (
    method === 'patch' &&
    parts.length === 2 &&
    ['deactivate', 'reactivate'].includes(parts[1])
  ) {
    const response = await apiClient.patch(
      `${API.customers}/${parts[0]}/status`,
      {
        isActive: parts[1] === 'reactivate' ? 'A' : 'I',
      },
    )

    return response.data
  }

  const creating = method === 'post' && parts.length === 0
  const updating = method === 'put' && parts.length === 1

  if (!creating && !updating) {
    throw new Error('Unsupported customer operation.')
  }

  const response = await apiClient.request({
    url,
    method,
    data: {
      customerName: data.customerName,
      mobileNumber: data.mobileNumber,
      emailAddress: data.email || null,
      address: data.address || null,
    },
  })

  return response.data
}