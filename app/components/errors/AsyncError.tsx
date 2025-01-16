import { useAsyncError } from '@remix-run/react'
// alerts
import AlertError from '~/components/alerts/AlertError'

const AsyncError: React.FC = () => {
  const error = useAsyncError()
  return <AlertError error={error} />
}

export default AsyncError
