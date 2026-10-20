import apiClient from './apiClient'

export async function getData(url, params, signal) {
  const response = await apiClient.get(url, { params, signal })
  return response.data
}

export async function saveData(url, data, method = 'post', requestId) {
  const response = await apiClient.request({
    url,
    method,
    data,
    headers: requestId ? { 'Idempotency-Key': requestId } : {},
  })

  return response.data
}