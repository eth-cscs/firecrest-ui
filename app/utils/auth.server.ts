/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { StatusCodes } from 'http-status-codes'
import { OAuth2Strategy } from 'remix-auth-oauth2'
import { Authenticator } from 'remix-auth'
// types
import type { Auth } from '~/types/auth'
// configs
import oidc from '~/configs/oidc.config'
import base from '~/configs/base.config'
// utils
import { getSession, commitSession, destroySession } from './session.server'
// logger
import logger from '~/logger/logger.server'
// errors
import { HttpError } from '~/errors/HttpError'
import { ReasonErrors } from '~/errors/reason-errors'
import { redirect } from 'react-router'

// The session key used to store auth data
export const AUTH_SESSION_KEY = 'user'

interface OidcDiscoveryDocument {
  authorization_endpoint: string
  token_endpoint: string
  userinfo_endpoint: string
  end_session_endpoint?: string
}

// remix-auth v4 dropped the AuthorizationError class it used to export — this is
// used purely as an internal signal within getAuthAccessToken below to trigger a
// token refresh, not part of remix-auth's own strategy flow.
class TokenExpiredError extends Error {}

// Module-level singletons — initialized lazily on first request
let _discovery: OidcDiscoveryDocument | null = null
let _authenticator: Authenticator<Auth> | null = null

function logOidcOp(action: string, startMs: number) {
  const durationMs = Math.round(performance.now() - startMs)
  const fields = {
    'event.action': action,
    'event.duration': durationMs * 1_000_000,
    component: 'oidc',
  }
  if (durationMs > 1_000) {
    logger.warn(fields, `Slow ${action}: ${durationMs}ms`)
  } else {
    logger.debug(fields, action)
  }
}

async function fetchDiscovery(): Promise<OidcDiscoveryDocument> {
  if (_discovery) return _discovery
  const url = `${oidc.issuerUrl}/.well-known/openid-configuration`
  const t = performance.now()
  const response = await fetch(url)
  logOidcOp('oidc.discovery', t)
  if (!response.ok) {
    throw new Error(`Failed to fetch OIDC discovery document from ${url}: ${response.statusText}`)
  }
  _discovery = (await response.json()) as OidcDiscoveryDocument
  return _discovery
}

export async function getAuthenticator(): Promise<Authenticator<Auth>> {
  if (_authenticator) return _authenticator

  const discovery = await fetchDiscovery()

  const strategy = new OAuth2Strategy<Auth>(
    {
      cookie: {
        name: 'oauth2',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
        ...(base.cookieSecure ? { secure: true } : {}),
      },
      authorizationEndpoint: discovery.authorization_endpoint,
      tokenEndpoint: discovery.token_endpoint,
      clientId: oidc.clientId,
      clientSecret: oidc.clientSecret,
      redirectURI: oidc.callbackUrl,
      scopes: ['openid', 'profile', 'email'],
    },
    async ({ tokens }) => {
      const t = performance.now()
      const response = await fetch(discovery.userinfo_endpoint, {
        headers: { Authorization: `Bearer ${tokens.accessToken()}` },
      })
      logOidcOp('oidc.userinfo', t)
      if (!response.ok) {
        throw new Error(`Failed to fetch OIDC userinfo: ${response.statusText}`)
      }
      const profile = (await response.json()) as Record<string, unknown>
      const expirationDate = tokens.accessTokenExpiresAt()
      expirationDate.setSeconds(expirationDate.getSeconds() - oidc.tokenExpirationBuffer)
      return {
        user: {
          username: (profile.preferred_username as string) || (profile.sub as string) || '',
          email: (profile.email as string) || '',
          firstName: (profile.given_name as string) || '',
          lastName: (profile.family_name as string) || '',
        },
        tokens: {
          accessToken: tokens.accessToken(),
          refreshToken: tokens.hasRefreshToken() ? tokens.refreshToken() : '',
          expirationDate: expirationDate,
          refreshExpirationDate: new Date(),
        },
      }
    },
  )
  _authenticator = new Authenticator<Auth>()
  _authenticator.use(strategy, 'oidc')
  return _authenticator
}

export async function getLogoutUrl(): Promise<string> {
  const discovery = await fetchDiscovery()
  return discovery.end_session_endpoint ?? oidc.issuerUrl
}

export async function getAuth(request: Request) {
  const session = await getSession(request.headers.get('Cookie'))
  return session.get(AUTH_SESSION_KEY)
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

export async function requireAuth(request: Request, failureRedirect = '/login') {
  const auth = await getAuth(request)
  const url = new URL(request.url)
  const returnTo = `${url.pathname}${url.search}`
  if (!auth) throw redirect(`${failureRedirect}?returnTo=${encodeURIComponent(returnTo)}`)
  return { auth, returnTo }
}

// TODO: Refactoring and code optimization
export async function getAuthAccessToken(request: Request, headers = new Headers()) {
  try {
    const authTokens = await getAuthTokens(request)
    if (!authTokens || !authTokens.accessToken) {
      const session = await getSession(request.headers.get('Cookie'))
      headers.append('Set-Cookie', await destroySession(session))
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
      logger.debug(
        { 'event.action': 'auth.token_expired', component: 'oidc' },
        'auth.token_expired',
      )
      throw new TokenExpiredError('Token expired')
    }
    logger.debug({ 'event.action': 'auth.token_valid', component: 'oidc' }, 'auth.token_valid')
    return authTokens.accessToken
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      const auth = await getAuth(request)
      const { access_token, refresh_token, expires_in } = await refreshAccessToken(
        request,
        auth.tokens.refreshToken,
      )
      const expirationDate = new Date()
      expirationDate.setSeconds(
        expirationDate.getSeconds() + expires_in - oidc.tokenExpirationBuffer,
      )
      auth.tokens = {
        accessToken: access_token,
        refreshToken: refresh_token,
        expirationDate: expirationDate,
      }
      const session = await getSession(request.headers.get('Cookie'))
      session.set(AUTH_SESSION_KEY, auth)
      headers.append('Set-Cookie', await commitSession(session))
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

// TODO: Export OIDC interaction in a separate service/utility
const refreshAccessToken = async (request: Request, refreshToken: string) => {
  const discovery = await fetchDiscovery()
  const params: Record<string, string> = {
    client_id: oidc.clientId,
    client_secret: oidc.clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  }
  const body = Object.keys(params)
    .map((key) => encodeURIComponent(key) + '=' + encodeURIComponent(params[key]))
    .join('&')
  const t = performance.now()
  const response = await fetch(discovery.token_endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: body,
  })
  logOidcOp('oidc.token_refresh', t)
  if (!response.ok) {
    const logoutUrl = await getLogoutUrl()
    const session = await getSession(request.headers.get('Cookie'))
    throw redirect(logoutUrl, { headers: { 'Set-Cookie': await destroySession(session) } })
  }
  return response.json() as Promise<{
    access_token: string
    refresh_token: string
    expires_in: number
  }>
}
