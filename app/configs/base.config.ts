/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

// env
import env from './env'
// helpers
import { getEnvVariable } from '~/helpers/env-helper'

const base = {
  nodeEnv: getEnvVariable(env, 'NODE_ENV'),
  appName: getEnvVariable(env, 'APP_NAME', false, 'App name'),
  companyName: getEnvVariable(env, 'COMPANY_NAME', false, 'Company name'),
  appVersion: getEnvVariable(env, 'APP_VERSION'),
  environment: getEnvVariable(env, 'ENVIRONMENT', false, 'development'),
  sessionSecret: getEnvVariable(env, 'SESSION_SECRET'),
  sessionFileDirPath: getEnvVariable(env, 'SESSION_FILE_DIR_PATH', false),
  logoPath: getEnvVariable(env, 'LOGO_PATH', false, './logo.svg'),
  serviceName: getEnvVariable(env, 'SERVICE_NAME', false, 'firecrest-web-ui'),
  supportUrl: getEnvVariable(env, 'SUPPORT_URL', false),
  repoUrl: getEnvVariable(env, 'REPO_URL', false),
  docUrl: getEnvVariable(env, 'DOC_URL', false),
}

export default base
