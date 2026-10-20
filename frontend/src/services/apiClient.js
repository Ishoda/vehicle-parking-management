import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  withCredentials: true,
})

export function getErrorMessage(error) {
  const data = error.response?.data

  if (data?.errors) {
    return Object.values(data.errors).flat().join(' ')
  }

  if (typeof data?.message === 'string') {
    return data.message
  }

  if (typeof data?.Message === 'string') {
    return data.Message
  }

  if (error.response?.status === 401) {
    return 'Your session has expired. Please sign in again.'
  }

  if (error.response?.status === 403) {
    return 'You do not have permission to perform this action.'
  }

  return (
    'The request could not be confirmed. ' +
    'Check your connection and refresh before trying again.'
  )
}

export default apiClient