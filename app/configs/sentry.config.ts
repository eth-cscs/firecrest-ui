// env
import env from './env'
// helpers
import { getEnvVariable } from '~/helpers/env-helper'

const sentry = {
  active: getEnvVariable(env, 'SENTRY_ACTIVE', false, false, true),
  dsn: getEnvVariable(env, 'SENTRY_DSN'),
  authToken: getEnvVariable(env, 'SENTRY_AUTH_TOKEN'),
  debug: getEnvVariable(env, 'SENTRY_DEBUG', false, false, true),
  tracesSampleRate: getEnvVariable(env, 'SENTRY_TRACES_SAMPLE_RATE', false, 0.0),
}

export default sentry
