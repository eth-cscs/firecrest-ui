/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { StatusCodes } from 'http-status-codes'
import { OAuth2Strategy } from 'remix-auth-oauth2'
import { Authenticator, AuthorizationError } from 'remix-auth'
import type { OAuth2Profile } from 'remix-auth-oauth2'
// types
import type { Auth } from '~/types/auth'
// configs
import oidc from '~/configs/oidc.config'
// utils
import { getSession, commitSession, destroySession, sessionStorage } from './session.server'
// logger
import logger from '~/logger/logger.server'
// errors
import { HttpError } from '~/errors/HttpError'
import { ReasonErrors } from '~/errors/reason-errors'
import { redirect } from '@remix-run/node'

// The session key remix-auth uses to store auth data (Authenticator default)
const AUTH_SESSION_KEY = 'user'

interface OidcDiscoveryDocument {
  authorization_endpoint: string
  token_endpoint: string
  userinfo_endpoint: string
  end_session_endpoint?: string
}

interface OidcProfile extends OAuth2Profile {
  _json: Record<string, unknown>
}

// Module-level singletons — initialized lazily on first request
let _discovery: OidcDiscoveryDocument | null = null
let _authenticator: Authenticator<Auth> | null = null

// Per-request session cache: eliminates duplicate Valkey GETs when requireAuth and
// getAuthAccessToken are called sequentially in the same loader.
const _sessionCache = new WeakMap<Request, Promise<any>>()

function getCachedSession(request: Request): Promise<any> {
  if (!_sessionCache.has(request)) {
    _sessionCache.set(request, getSession(request.headers.get('Cookie')))
  }
  return _sessionCache.get(request)!
}

function logOidcOp(action: string, startMs: number) {
  const durationMs = Math.round(performance.now() - startMs)
  const fields = { 'event.action': action, 'event.duration': durationMs * 1_000_000, component: 'oidc' }
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
    throw new Error(
      `Failed to fetch OIDC discovery document from ${url}: ${response.statusText}`,
    )
  }
  _discovery = (await response.json()) as OidcDiscoveryDocument
  return _discovery
}

class OidcStrategy extends OAuth2Strategy<Auth, OidcProfile> {
  private userinfoURL: string

  constructor(
    options: {
      authorizationURL: string
      tokenURL: string
      userinfoURL: string
      clientID: string
      clientSecret: string
      callbackURL: string
    },
    verify: ConstructorParameters<typeof OAuth2Strategy<Auth, OidcProfile>>[1],
  ) {
    super(
      {
        authorizationURL: options.authorizationURL,
        tokenURL: options.tokenURL,
        clientID: options.clientID,
        clientSecret: options.clientSecret,
        callbackURL: options.callbackURL,
        scope: 'openid profile email',
      },
      verify,
    )
    this.name = 'oidc'
    this.userinfoURL = options.userinfoURL
  }

  protected async userProfile(accessToken: string): Promise<OidcProfile> {
    const t = performance.now()
    const response = await fetch(this.userinfoURL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    logOidcOp('oidc.userinfo', t)
    if (!response.ok) {
      throw new Error(`Failed to fetch OIDC userinfo: ${response.statusText}`)
    }
    const data = (await response.json()) as Record<string, unknown>
    return {
      provider: 'oidc',
      displayName: data.name as string,
      id: data.sub as string,
      name: {
        familyName: data.family_name as string,
        givenName: data.given_name as string,
      },
      emails: [{ value: data.email as string }],
      _json: data,
    }
  }
}

export async function getAuthenticator(): Promise<Authenticator<Auth>> {
  if (_authenticator) return _authenticator

  const discovery = await fetchDiscovery()

  const strategy = new OidcStrategy(
    {
      authorizationURL: discovery.authorization_endpoint,
      tokenURL: discovery.token_endpoint,
      userinfoURL: discovery.userinfo_endpoint,
      clientID: oidc.clientId,
      clientSecret: oidc.clientSecret,
      callbackURL: oidc.callbackUrl,
    },
    async ({ accessToken, refreshToken, extraParams, profile }) => {
      const { expires_in } = extraParams as unknown as { expires_in: number }
      const expirationDate = new Date()
      const refreshExpirationDate = new Date()
      expirationDate.setSeconds(expirationDate.getSeconds() + expires_in - oidc.tokenExpirationBuffer)
      return {
        user: {
          username: (profile._json.preferred_username as string) || profile.id || '',
          email: profile.emails?.[0]?.value || '',
          firstName: profile.name?.givenName || '',
          lastName: profile.name?.familyName || '',
        },
        tokens: {
          accessToken: accessToken,
          refreshToken: refreshToken || '',
          expirationDate: expirationDate,
          refreshExpirationDate: refreshExpirationDate,
        },
      }
    },
  )

  _authenticator = new Authenticator<Auth>(sessionStorage)
  _authenticator.use(strategy)
  return _authenticator
}

export async function getLogoutUrl(): Promise<string> {
  const discovery = await fetchDiscovery()
  return discovery.end_session_endpoint ?? oidc.issuerUrl
}

export async function getAuth(request: Request) {
  const session = await getCachedSession(request)
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

// Deduplicates concurrent token refresh attempts for the same session.
// Remix runs all matched route loaders in parallel; without this, two loaders
// hitting an expired token at the same time would both try to use the same
// single-use refresh token — the second call would fail and trigger logout.
const _pendingRefresh = new Map<string, Promise<string>>()

// TODO: Refactoring and code optimization
export async function getAuthAccessToken(request: Request, headers = new Headers()) {
  try {
    const authTokens = await getAuthTokens(request)
    if (!authTokens || !authTokens.accessToken) {
      const session = await getCachedSession(request)
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
      throw new AuthorizationError('Token expired')
    }
    return authTokens.accessToken
  } catch (error) {
    if (error instanceof AuthorizationError) {
      const cookieKey = request.headers.get('Cookie') ?? ''
      const existing = _pendingRefresh.get(cookieKey)
      if (existing) {
        return existing
      }
      const refreshPromise = (async () => {
        const auth = await getAuth(request)
        const { access_token, refresh_token, expires_in } = await refreshAccessToken(
          request,
          auth.tokens.refreshToken,
        )
        const expirationDate = new Date()
        expirationDate.setSeconds(expirationDate.getSeconds() + expires_in - oidc.tokenExpirationBuffer)
        auth.tokens = {
          accessToken: access_token,
          refreshToken: refresh_token,
          expirationDate: expirationDate,
        }
        const session = await getCachedSession(request)
        session.set(AUTH_SESSION_KEY, auth)
        headers.append('Set-Cookie', await commitSession(session))
        if (request.method === 'GET') {
          const url = request.url
          if (url.indexOf('/api/') < 0) {
            throw redirect(url, { headers })
          }
        }
        return access_token
      })()
      _pendingRefresh.set(cookieKey, refreshPromise)
      refreshPromise.finally(() => _pendingRefresh.delete(cookieKey))
      return refreshPromise
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
    const authenticator = await getAuthenticator()
    const logoutUrl = await getLogoutUrl()
    await authenticator.logout(request, { redirectTo: logoutUrl })
    throw new Error('Invalid refresh token, authentication failed')
  }
  return response.json() as Promise<{ access_token: string; refresh_token: string; expires_in: number }>
}
