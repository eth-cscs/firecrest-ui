/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { useAsyncError } from 'react-router'
// alerts
import AlertError from '~/components/alerts/AlertError'

// Maintenance never reaches here: the deferred promises this backs resolve with a flagged
// payload instead of rejecting (see api.ts's isMaintenancePayload), so <Await errorElement>
// only ever sees genuine, unexpected errors.
const AsyncError: React.FC = () => {
  const error: any = useAsyncError()
  return <AlertError error={error} />
}

export default AsyncError
