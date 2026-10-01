import { useState } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../services/apiClient'

export default function AccessCheckPage({ title, endpoint }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function checkAccess() {
    setLoading(true)
    setMessage('')
    setError('')

    try {
      const response = await apiClient.get(endpoint)
      setMessage(response.data.message)
    } catch (requestError) {
      const status = requestError.response?.status

      if (status === 401) {
        setError('Your session has expired. Please log in again.')
      } else if (status === 403) {
        setError('You do not have permission to access this function.')
      } else {
        setError('Could not check access. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <h1>{title}</h1>

      <p className="auth-description">
        Verify your access with the server.
      </p>

      <button
        type="button"
        disabled={loading}
        onClick={checkAccess}
      >
        {loading ? 'Checking…' : 'Check access'}
      </button>

      {message && <p role="status">{message}</p>}
      {error && <p role="alert">{error}</p>}

      <p><Link to="/">Back to dashboard</Link></p>
    </main>
  )
}