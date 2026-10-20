import ErrorPage from '../components/ErrorPage'

export default function ForbiddenPage() {
  return (
    <ErrorPage
      code="403"
      title="This space is restricted."
      description="Your account doesn’t have permission to open this page. You can return to the dashboard to continue."
    />
  )
}