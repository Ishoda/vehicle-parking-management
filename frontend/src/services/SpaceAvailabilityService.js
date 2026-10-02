import apiClient from './apiClient'

export async function getSpaceAvailability(signal) {
  const response = await apiClient.get('/SpaceAvailability', {
    signal,
  })

  return response.data
}