/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

export interface AuthUser {
  username: string
  email: string
  firstName: string
  lastLame: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expirationDate: Date
  refreshExpirationDate: Date
}

export interface Auth {
  user: AuthUser
  tokens: AuthTokens
}
