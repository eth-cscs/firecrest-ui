/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

// env
import env from './env'
// helpers
import { getEnvVariable } from '~/helpers/env-helper'

const keycloak = {
  domain: getEnvVariable(env, 'KEYCLOAK_DOMAIN'),
  realm: getEnvVariable(env, 'KEYCLOAK_REALM'),
  clientId: getEnvVariable(env, 'KEYCLOAK_CLIENT_ID'),
  clientSecret: getEnvVariable(env, 'KEYCLOAK_CLIENT_SECRET'),
  callbackUrl: getEnvVariable(env, 'KEYCLOAK_CALLBACK_URL'),
  logoutRedirectUrl: getEnvVariable(env, 'KEYCLOAK_LOGOUT_REDIRECT_URL'),
  useSSL: getEnvVariable(env, 'KEYCLOAK_USE_SSL', false, true, true),
}

export default keycloak
