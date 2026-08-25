/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { reactRouter } from '@react-router/dev/vite'

export default defineConfig({
  plugins: [reactRouter(), tsconfigPaths()],
  build: {
    // The client build's output is served as-is from /assets in production (see server.js), so
    // a sourcemap here would be publicly downloadable next to the bundle it maps - and nothing
    // in this repo consumes/uploads it (no error-tracking integration), so there's no offsetting
    // benefit to shipping one.
    sourcemap: false,
  },
  ssr: {
    // pino uses worker threads (thread-stream) internally; Vite 6's SSR
    // transform pipeline breaks CJS packages with native internals, so both
    // must be resolved by Node directly rather than bundled by Vite.
    external: ['pino', 'thread-stream'],
  },
})
