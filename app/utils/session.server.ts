/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import Redis from 'ioredis'
import { createCookie, createSessionStorage } from 'react-router'
import { createFileSessionStorage } from '@react-router/node'
// configs
import base from '~/configs/base.config'
import redisConfig from '~/configs/redis.config'
// loggers
import logger from '~/logger/logger.server'

export const returnToCookie = createCookie('__return-to', {
  path: '/',
  httpOnly: true,
  sameSite: 'lax',
  secure: base.cookieSecure,
  maxAge: 60, // 1 min: is enough for the round-trip of login
})

export const sessionCookie = createCookie('__session', {
  maxAge: 60 * 60, // 1 hour
  sameSite: 'lax', // this helps with CSRF
  path: '/', // remember to add this so the cookie will work in all routes
  httpOnly: true, // for security reasons, make this cookie http only
  secrets: [base.sessionSecret], // replace this with an actual secret
  secure: base.cookieSecure,
})

// @mcansh/remix-redis-session-storage pins @remix-run/node and is unmaintained for
// React Router v7 — reimplemented inline against react-router's generic
// createSessionStorage (the package itself was just this thin wrapper).
function createRedisSessionStorage({
  redis,
  cookie,
}: {
  redis: Redis
  cookie: ReturnType<typeof createCookie>
}) {
  return createSessionStorage({
    cookie,
    async createData(data, expires) {
      const id = Math.random().toString(36).substring(2)
      await redis.set(id, JSON.stringify(data))
      if (expires) {
        await redis.expireat(id, Math.floor(expires.getTime() / 1000))
      }
      return id
    },
    async readData(id) {
      const data = await redis.get(id)
      if (!data) return null
      try {
        return JSON.parse(data)
      } catch {
        return null
      }
    },
    async updateData(id, data, expires) {
      await redis.set(id, JSON.stringify(data))
      if (expires) {
        await redis.expireat(id, Math.floor(expires.getTime() / 1000))
      }
    },
    async deleteData(id) {
      await redis.del(id)
    },
  })
}

export let sessionStorage: any

if (redisConfig.active) {
  const redis = new Redis({
    port: parseInt(redisConfig.port),
    host: redisConfig.host,
    password: redisConfig.authPassword,
    maxRetriesPerRequest: 3,
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
