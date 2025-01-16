import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { installGlobals } from '@remix-run/node'
import { vitePlugin as remix } from '@remix-run/dev'
import { sentryVitePlugin } from '@sentry/vite-plugin'

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
    sentryVitePlugin({
      org: 'cscs-131',
      project: 'firecrest-web-ui-v2',
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
  build: {
    sourcemap: true,
  },
})
