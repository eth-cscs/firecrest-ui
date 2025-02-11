/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { useAsyncError } from '@remix-run/react'
// alerts
import AlertError from '~/components/alerts/AlertError'

const AsyncError: React.FC = () => {
  const error = useAsyncError()
  return <AlertError error={error} />
}

export default AsyncError
