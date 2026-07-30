/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { useEffect } from 'react'
import { useAsyncError } from '@remix-run/react'
// alerts
import AlertError from '~/components/alerts/AlertError'
// apis
import { isMaintenanceError, getMaintenanceErrorMessage } from '~/apis/api'
// contexts
import { useMaintenance } from '~/contexts/MaintenanceContext'

const AsyncError: React.FC = () => {
  const error: any = useAsyncError()
  const { setMaintenance } = useMaintenance()

  // <Await errorElement> renders this in place, inline, rather than bubbling to the route's
  // ErrorBoundary - so maintenance has to be signalled through the same context the
  // polling/fetcher call sites use, instead of relying on a thrown Response reaching a boundary.
  useEffect(() => {
    if (isMaintenanceError(error)) {
      setMaintenance(true, getMaintenanceErrorMessage(error))
    }
  }, [error])

  if (isMaintenanceError(error)) {
    return null
  }
  return <AlertError error={error} />
}

export default AsyncError
