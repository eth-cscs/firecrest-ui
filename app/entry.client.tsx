/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { hydrateRoot } from 'react-dom/client'
import { startTransition, StrictMode, useEffect } from 'react'
import { HydratedRouter } from 'react-router/dom'
import { useLocation, useMatches } from 'react-router'

// Declare globals
declare global {
  interface Window {
    ENV: {
      APP_VERSION: string
      ENVIRONMENT: string
    }
  }
}

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>,
  )
})
