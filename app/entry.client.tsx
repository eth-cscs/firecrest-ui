import * as Sentry from '@sentry/remix'
import { replayIntegration } from '@sentry/remix'
import { hydrateRoot } from 'react-dom/client'
import { startTransition, StrictMode, useEffect } from 'react'
import { RemixBrowser, useLocation, useMatches } from '@remix-run/react'

// Declare globals
declare global {
  interface Window {
    ENV: {
      APP_VERSION: string
      ENVIRONMENT: string
      SENTRY_ACTIVE: boolean
      SENTRY_DSN: string
      SENTRY_DEBUG: boolean
      SENTRY_TRACES_SAMPLE_RATE: number
    }
  }
}

// Initialize sentry
if (window.ENV.SENTRY_ACTIVE) {
  Sentry.init({
    dsn: window.ENV.SENTRY_DSN,
    debug: window.ENV.SENTRY_DEBUG,
    environment: window.ENV.ENVIRONMENT,
    release: window.ENV.APP_VERSION,
    tracesSampleRate: parseFloat(window.ENV.SENTRY_TRACES_SAMPLE_RATE + ''),
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1,
    integrations: [
      Sentry.browserTracingIntegration({
        useEffect,
        useLocation,
        useMatches,
      }),
      replayIntegration(),
    ],
  })
}

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <RemixBrowser />
    </StrictMode>,
  )
})
