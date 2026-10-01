import { Link } from 'react-router-dom'

export default function ForbiddenPage() {
  return (
    <main className="auth-page">
      <h1>Access denied</h1>
      <p>You do not have permission to open this page.</p>
      <p><Link to="/">Back to dashboard</Link></p>
    </main>
  )
}