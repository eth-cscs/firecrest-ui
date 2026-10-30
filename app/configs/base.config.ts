/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

// env
import env from './env'
// helpers
import { getEnvVariable } from '~/helpers/env-helper'

const JOB_LOG_MODES = ['tail', 'view'] as const

// Fails at startup on a typo instead of silently falling back to 'tail'.
const getJobLogDefaultMode = (): (typeof JOB_LOG_MODES)[number] => {
  const mode = getEnvVariable(env, 'JOB_LOG_DEFAULT_MODE', false, 'tail')
  if (!JOB_LOG_MODES.includes(mode)) {
    throw new Error(
      `JOB_LOG_DEFAULT_MODE must be one of: ${JOB_LOG_MODES.join(', ')} (got "${mode}")`,
    )
  }
  return mode
}

const base = {
  nodeEnv: getEnvVariable(env, 'NODE_ENV'),
  cookieSecure: getEnvVariable(env, 'COOKIE_SECURE', false, 'true') !== 'false',
  appName: getEnvVariable(env, 'APP_NAME', false, 'App name'),
  companyName: getEnvVariable(env, 'COMPANY_NAME', false, 'Company name'),
  appVersion: getEnvVariable(env, 'APP_VERSION'),
  environment: getEnvVariable(env, 'ENVIRONMENT', false, 'development'),
  sessionSecret: getEnvVariable(env, 'SESSION_SECRET'),
  sessionFileDirPath: getEnvVariable(env, 'SESSION_FILE_DIR_PATH', false),
  logoPath: getEnvVariable(env, 'LOGO_PATH', false, '/logo.svg'),
  serviceName: getEnvVariable(env, 'SERVICE_NAME', false, 'firecrest-web-ui'),
  platform: getEnvVariable(env, 'PLATFORM', false),
  supportUrl: getEnvVariable(env, 'SUPPORT_URL', false),
  repoUrl: getEnvVariable(env, 'REPO_URL', false),
  docUrl: getEnvVariable(env, 'DOC_URL', false),
  statusUrl: getEnvVariable(env, 'STATUS_URL', false),
  // The job log "View" mode pages through files with the backend's /ops/view, which needs
  // FirecREST >= 2.7.0. Off by default, so deployments on older backends only offer "Tail".
  jobLogViewModeEnabled:
    getEnvVariable(env, 'JOB_LOG_VIEW_MODE_ENABLED', false, 'false') === 'true',
  // Mode the job log opens in when View mode is enabled: 'tail' or 'view'.
  jobLogDefaultMode: getJobLogDefaultMode(),
}

export default base
