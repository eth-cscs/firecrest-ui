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
import logger from '~/logger/logger'

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
  sessionStorage = createRedisSessionStorage({
    redis,
    cookie: sessionCookie,
  })
  logger.info('REDIS session')
} else {
  sessionStorage = createFileSessionStorage({
    // The root directory where you want to store the files.
    // Make sure it's writable!
    dir: base.sessionFileDirPath,
    cookie: sessionCookie,
  })
  logger.info('FILE session')
}

export const { getSession, commitSession, destroySession } = sessionStorage
