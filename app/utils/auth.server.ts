/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { StatusCodes } from 'http-status-codes'
import { KeycloakStrategy } from 'remix-keycloak'
import { Authenticator, AuthorizationError } from 'remix-auth'
// types
import type { Auth } from '~/types/auth'
// configs
import keycloak from '~/configs/keycloak.config'
// utils
import { getSession, sessionStorage } from './session.server'
// errors
import { HttpError } from '~/errors/HttpError'
import { ReasonErrors } from '~/errors/reason-errors'
import { redirect } from '@remix-run/node'

export const logoutUrl = `${keycloak.useSSL ? 'https' : 'http'}://${keycloak.domain}/realms/${
  keycloak.realm
}/protocol/openid-connect/logout`

export const authenticator: any = new Authenticator<Auth>(sessionStorage)

export async function getAuth(request: Request) {
  const session = await getSession(request.headers.get('Cookie'))
  return session.get(authenticator.sessionKey)
}

export async function getAuthUser(request: Request) {
  const auth = await getAuth(request)
  if (!auth || !auth?.user) return null
  return auth.user
}

export async function getAuthTokens(request: Request) {
  const auth = await getAuth(request)
  if (!auth || !auth?.tokens) return null
  return auth.tokens
}

// TODO: Refactoring and code optimization
export async function getAuthAccessToken(request: Request, headers = new Headers()) {
  try {
    const authTokens = await getAuthTokens(request)
    if (!authTokens || !authTokens.accessToken) {
      const session = await getSession(request.headers.get('Cookie'))
      headers.append('Set-Cookie', await sessionStorage.destroySession(session))
      if (request.method === 'GET') {
        const url = request.url
        if (url.indexOf('/api/') < 0) {
          throw redirect(url, { headers })
        }
      }
      throw new HttpError(
        StatusCodes.UNAUTHORIZED,
        ReasonErrors.NOT_AUTHENTICATED_OR_SESSION_EXPIRED,
      )
    }
    if (new Date(authTokens.expirationDate) <= new Date()) {
      throw new AuthorizationError('Token expired')
    }
    return authTokens.accessToken
  } catch (error) {
    if (error instanceof AuthorizationError) {
      const auth = await getAuth(request)
      const { access_token, refresh_token, expires_in } = await refreshAccessToken(
        request,
        auth.tokens.refreshToken,
      )
      const expirationDate = new Date()
      expirationDate.setSeconds(expirationDate.getSeconds() + expires_in - 30)
      auth.tokens = {
        accessToken: access_token,
        refreshToken: refresh_token,
        expirationDate: expirationDate,
      }
      const session = await getSession(request.headers.get('Cookie'))
      session.set(authenticator.sessionKey, auth)
      headers.append('Set-Cookie', await sessionStorage.commitSession(session))
      if (request.method === 'GET') {
        const url = request.url
        if (url.indexOf('/api/') < 0) {
          throw redirect(url, { headers })
        }
      }
      return access_token
    }
    throw error
  }
}

// TODO: Export kc interaction in a separate service/utility
const refreshAccessToken = async (request: Request, refreshToken: string) => {
  const params: any = {
    client_id: keycloak.clientId,
    client_secret: keycloak.clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  }
  const body = Object.keys(params)
    .map((key) => {
      return encodeURIComponent(key) + '=' + encodeURIComponent(params[key])
    })
    .join('&')
  const response = await fetch(
    `${keycloak.useSSL ? 'https' : 'http'}://${keycloak.domain}/realms/${
      keycloak.realm
    }/protocol/openid-connect/token`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
      body: body,
    },
  )
  if (!response.ok) {
    await authenticator.logout(request, { redirectTo: logoutUrl })
    throw new Error('Invalid refresh token, authentication failed')
  }
  const data = await response.json()
  return data
}

const keycloakStrategy = new KeycloakStrategy(
  {
    useSSL: keycloak.useSSL,
    domain: keycloak.domain,
    realm: keycloak.realm,
    clientID: keycloak.clientId,
    clientSecret: keycloak.clientSecret,
    callbackURL: keycloak.callbackUrl,
  },
  async ({ accessToken, refreshToken, extraParams, profile }) => {
    const { expires_in } = extraParams
    const expirationDate = new Date()
    const refreshExpirationDate = new Date()
    expirationDate.setSeconds(expirationDate.getSeconds() + expires_in - 30)
    return {
      user: {
        username: profile._json.preferred_username,
        email: profile.emails[0].value,
        firstName: profile.name.givenName,
        lastName: profile.name.familyName,
      },
      tokens: {
        accessToken: accessToken,
        refreshToken: refreshToken,
        expirationDate: expirationDate,
        refreshExpirationDate: refreshExpirationDate,
      },
    }
  },
)

authenticator.use(keycloakStrategy)
