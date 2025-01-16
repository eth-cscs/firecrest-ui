// env
import env from './env'
// helpers
import { getEnvVariable } from '~/helpers/env-helper'

const firecrest = {
  baseUrl: getEnvVariable(env, 'FIRECREST_API_BASE_URL'),
}

export default firecrest
