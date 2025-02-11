/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { redirect } from '@remix-run/node'
import { useRouteError } from '@remix-run/react'
import { captureRemixErrorBoundaryError } from '@sentry/remix'
import type { LoaderFunction, LoaderFunctionArgs } from '@remix-run/node'
// loggers
import logger from '~/logger/logger'
// helpers
import { logInfoHttp } from '~/helpers/log-helper'
import { getHealthyFileSystemSystems } from '~/helpers/system-helper'
import {
  getDefaultFileSystemFromSystem,
  getDefaultSystemFromSystems,
} from '~/modules/status/helpers/system-helper'
import {
  buildFileSystemNavigationPath
} from '~/modules/filesystem/helpers/filesystem-helper'
// utils
import { getAuthAccessToken, authenticator } from '~/utils/auth.server'
// apis
import { getSystems } from '~/apis/status-api'
// views
import ErrorView from '~/components/views/ErrorView'

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
  // Check authentication
  const auth = await authenticator.isAuthenticated(request, {
    failureRedirect: '/login',
  })
  logInfoHttp({
    message: 'Filesystem transfer index page',
    request: request,
    extraInfo: { username: auth.user.username },
  })
  // Get auth access token
  const accessToken = await getAuthAccessToken(request)
  // Call api/s and fetch data
  const { systems } = await getSystems(accessToken)
  const activeSystems = getHealthyFileSystemSystems(systems)
  // Check if there is at least on system
  if (activeSystems && activeSystems.length <= 0) {
    throw new Error('No available systems')
  }
  // systems = systems.filter((sys) => sys.health.healthy)
  // Get first file system home direc
  const system = getDefaultSystemFromSystems(activeSystems)
  const fileSystem = getDefaultFileSystemFromSystem(system)
  // Validation
  if (system === null || fileSystem === null) {
    throw new Error('Filesystem(s) configuration error')
  }
  // Redirect
  if (fileSystem.defaultWorkDir) {
    const targetPath = `${fileSystem.path}/${auth.user.username}`
    return redirect(buildFileSystemNavigationPath(system.name, targetPath), {
      headers: request.headers,
    })
  }
  return redirect(buildFileSystemNavigationPath(system.name, fileSystem.path), {
    headers: request.headers,
  })
}

export function ErrorBoundary() {
  const error = useRouteError()
  logger.error(error)
  captureRemixErrorBoundaryError(error)
  return <ErrorView error={error} />
}
