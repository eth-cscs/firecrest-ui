/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

// env
import env from './env'
// helpers
import { getEnvVariable } from '~/helpers/env-helper'

const oidc = {
  issuerUrl: getEnvVariable(env, 'OIDC_ISSUER_URL'),
  clientId: getEnvVariable(env, 'OIDC_CLIENT_ID'),
  clientSecret: getEnvVariable(env, 'OIDC_CLIENT_SECRET'),
  callbackUrl: getEnvVariable(env, 'OIDC_CALLBACK_URL'),
  postLogoutRedirectUrl: getEnvVariable(env, 'OIDC_POST_LOGOUT_REDIRECT_URL'),
}

export default oidc
