/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import _ from 'lodash'
import type { LoaderFunction, LoaderFunctionArgs } from '@remix-run/node'
import { useLoaderData, useActionData, useRouteError } from '@remix-run/react'
// loggers
import logger from '~/logger/logger'
// helpers
import {
  searchSystemByName,
  searchFileSystemByPath,
  getDefaultFileSystemFromSystem,
} from '~/modules/status/helpers/system-helper'
import { logInfoHttp } from '~/helpers/log-helper'
import { getHealthyFileSystemSystems } from '~/helpers/system-helper'

// utils
import { getAuthAccessToken, authenticator } from '~/utils/auth.server'
// helpers
import { getErrorFromData } from '~/helpers/error-helper'
// apis
import { getSystems } from '~/apis/status-api'
import { getOpsLs } from '~/apis/filesystem-api'
// views
import ErrorView from '~/components/views/ErrorView'
import FileListView from '~/modules/filesystem/components/views/FileListView'
// config
import uiConfig from '~/configs/ui.config'

export const loader: LoaderFunction = async ({ params, request }: LoaderFunctionArgs) => {
  // Check authentication
  const auth = await authenticator.isAuthenticated(request, {
    failureRedirect: '/login',
  })
  logInfoHttp({
    message: 'Filesystem index page',
    request: request,
    extraInfo: { username: auth.user.username },
  })
  // Get auth access token
  const accessToken = await getAuthAccessToken(request)
  // Get path params
  const systemName = params.system
  // Get url params
  const url = new URL(request.url)
  const targetPath = url.searchParams.get('targetPath')
  // Local variables
  let path = targetPath
  // Validate system name
  if (systemName === undefined || _.isEmpty(systemName)) {
    throw new Error('System not specified')
  }
  // Call api/s and fetch data
  const { systems } = await getSystems(accessToken)
  const activeSystems = getHealthyFileSystemSystems(systems)
  // Check if there is at least on system
  if (activeSystems && activeSystems.length <= 0) {
    throw new Error('No available systems')
  }
  // Get system
  const system = searchSystemByName(activeSystems, systemName)
  // Get file system & path
  let fileSystem = null
  if (targetPath === undefined || _.isEmpty(targetPath)) {
    fileSystem = getDefaultFileSystemFromSystem(system)
    if (fileSystem) {
      path = fileSystem.path
      if (fileSystem.defaultWorkDir) {
        path = `${fileSystem.path}/${auth.user.username}`
      }
    }
  } else {
    fileSystem = searchFileSystemByPath(system.fileSystems, path!, false)
  }
  // Validation
  if (system === null || fileSystem === null) {
    throw new Error('Filesystem(s) configuration error')
  }
  // Call api/s and fetch data
  const { output } = await getOpsLs(accessToken, systemName, path!, request)
  // Return response
  return {
    files: output,
    currentPath: path,
    system: system,
    fileSystem: fileSystem,
    systems: systems,
    username: auth.user.username,
    fileUploadLimit: uiConfig.fileUploadLimit,
  }
}

export default function AppComputeIndexRoute() {
  const data = useActionData()
  const { files, currentPath, system, fileSystem, systems, username, fileUploadLimit }: any =
    useLoaderData()
  return (
    <FileListView
      files={files}
      currentPath={currentPath}
      system={system}
      fileSystem={fileSystem}
      systems={systems}
      username={username}
      fileUploadLimit={fileUploadLimit}
      error={getErrorFromData(data)}
    />
  )
}

export function ErrorBoundary() {
  const error = useRouteError()
  logger.error(error)
  return <ErrorView error={error} />
}
