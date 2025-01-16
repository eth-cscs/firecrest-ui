// env
import env from './env'
// helpers
import { getEnvVariable } from '~/helpers/env-helper'

const loggerConfig = {
  loggingLevel: getEnvVariable(env, 'LOGGING_LEVEL', false, 'debug'),
}

export default loggerConfig
