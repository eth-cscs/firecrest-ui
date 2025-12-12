/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { useMatches } from '@remix-run/react'

export function useSystemAccountFromUrl() {
  const matches = useMatches()

  let systemName: string | undefined
  let accountName: string | undefined

  for (const m of matches) {
    const p = (m.params ?? {}) as Record<string, string | undefined>
    systemName ??= p.systemName
    accountName ??= p.accountName
  }

  return { systemName, accountName }
}
