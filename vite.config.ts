/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { installGlobals } from '@remix-run/node'
import { vitePlugin as remix } from '@remix-run/dev'

installGlobals()

export default defineConfig({
  plugins: [
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_lazyRouteDiscovery: true,
        v3_relativeSplatPath: true,
        v3_singleFetch: true,
        v3_throwAbortReason: true,
      },
    }),
    tsconfigPaths(),
  ],
  build: {
    sourcemap: true,
  },
})
