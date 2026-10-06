import apiClient from './apiClient'

export async function getCurrentParking(searchTerm = '', signal) {
  const response = await apiClient.get('/CurrentParking', {
    params: searchTerm.trim() ? { searchTerm: searchTerm.trim() } : {},
    signal,
  })

  return response.data
}