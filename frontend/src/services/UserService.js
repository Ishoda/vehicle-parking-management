import apiClient from './apiClient'

export async function getUsers() {
  const response = await apiClient.get('/Users')
  return response.data
}

export async function createUser(details) {
  const response = await apiClient.post('/Users', details)
  return response.data
}

export async function updateUser(userId, details) {
  const response = await apiClient.put(`/Users/${userId}`, details)
  return response.data
}

export async function deactivateUser(userId) {
  const response = await apiClient.patch(`/Users/${userId}/deactivate`)
  return response.data
}