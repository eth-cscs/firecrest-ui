/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import Redis from 'ioredis'
import { createCookie, createFileSessionStorage } from '@remix-run/node'
import { createRedisSessionStorage } from '@mcansh/remix-redis-session-storage'
// configs
import base from '~/configs/base.config'
import redisConfig from '~/configs/redis.config'
// loggers
import logger from '~/logger/logger.server'

export const returnToCookie = createCookie('__return-to', {
  path: '/',
  httpOnly: true,
  sameSite: 'lax',
  secure: base.nodeEnv === 'production', // enable this in prod only
  maxAge: 60, // 1 min: is enough for the round-trip of login
})

export const sessionCookie = createCookie('__session', {
  maxAge: 60 * 60, // 1 hour
  sameSite: 'lax', // this helps with CSRF
  path: '/', // remember to add this so the cookie will work in all routes
  httpOnly: true, // for security reasons, make this cookie http only
  secrets: [base.sessionSecret], // replace this with an actual secret
  secure: base.nodeEnv === 'production', // enable this in prod only
})

export let sessionStorage: any

if (redisConfig.active) {
  const redis = new Redis({
    port: parseInt(redisConfig.port),
    host: redisConfig.host,
    password: redisConfig.authPassword,
  })
  redis.on('connect', () => logger.info({ component: 'valkey' }, 'Valkey connected'))
  redis.on('ready', () => logger.info({ component: 'valkey' }, 'Valkey ready'))
  redis.on('error', (err: Error) => logger.error({ err, component: 'valkey' }, 'Valkey error'))
  redis.on('reconnecting', () => logger.warn({ component: 'valkey' }, 'Valkey reconnecting'))
  redis.on('close', () => logger.warn({ component: 'valkey' }, 'Valkey connection closed'))
  sessionStorage = createRedisSessionStorage({ redis, cookie: sessionCookie })
  logger.info({ component: 'valkey' }, 'Valkey session storage initialised')
} else {
  sessionStorage = createFileSessionStorage({
    dir: base.sessionFileDirPath,
    cookie: sessionCookie,
  })
  logger.info('File session storage initialised')
}

function logSessionOp(action: string, startMs: number) {
  const durationMs = Math.round(performance.now() - startMs)
  const fields = {
    'event.action': action,
    'event.duration': durationMs * 1_000_000,
    component: 'valkey',
  }
  if (durationMs > 500) {
    logger.warn(fields, `Slow ${action}: ${durationMs}ms`)
  } else {
    logger.debug(fields, action)
  }
}

export async function getSession(cookie: string | null) {
  const t = performance.now()
  const session = await sessionStorage.getSession(cookie)
  logSessionOp('session.read', t)
  return session
}

export async function commitSession(session: any) {
  const t = performance.now()
  const cookie = await sessionStorage.commitSession(session)
  logSessionOp('session.commit', t)
  return cookie
}

export async function destroySession(session: any) {
  const t = performance.now()
  const cookie = await sessionStorage.destroySession(session)
  logSessionOp('session.destroy', t)
  return cookie
}
