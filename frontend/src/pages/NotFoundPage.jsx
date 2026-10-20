import ErrorPage from '../components/ErrorPage'

export default function NotFoundPage() {
  return (
    <ErrorPage
      code="404"
      title="Looks like a wrong turn."
      description="The page you’re looking for couldn’t be found. Let’s get you back to your parking workspace."
    />
  )
}