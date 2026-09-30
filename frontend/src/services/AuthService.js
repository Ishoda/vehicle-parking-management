import apiClient from './apiClient'

export async function login(credentials) {
  const response = await apiClient.post('/UserLogin/Login', credentials)
  return response.data
}

export async function getCurrentUser() {
  const response = await apiClient.get('/UserLogin/Me')
  return response.data
}

export async function logout() {
  await apiClient.post('/UserLogin/Logout')
}