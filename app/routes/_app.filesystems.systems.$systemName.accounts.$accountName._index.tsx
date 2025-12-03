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
  getFileSystemByTargetPath,
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
// types
import type { File } from '~/types/api-filesystem'

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
  const systemName = params.systemName
  const accountName = params.accountName
  // Get url params
  const url = new URL(request.url)
  const targetPath = url.searchParams.get('targetPath')
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
  const { fileSystem, path } = getFileSystemByTargetPath(system, targetPath, auth.user.username)
  // Call api/s and fetch data
  let files: File[] = []
  let remoteFsError: any = null
  try {
    const { output } = await getOpsLs(accessToken, systemName, path!, request)
    files = output || []
  } catch (err) {
    logger.error('Error fetching filesystem data', { error: err })
    if (err?.status === 404) {
      remoteFsError = { message: "The filesystem path doesn't exist", status: 404 }
    } else {
      throw err
    }
  }
  // Return response
  return {
    files,
    currentPath: path,
    system: system,
    fileSystem: fileSystem,
    systems: systems,
    username: auth.user.username,
    fileUploadLimit: uiConfig.fileUploadLimit,
    remoteFsError: remoteFsError,
    accountName,
  }
}

export default function AppComputeIndexRoute() {
  const data = useActionData()
  const {
    files,
    currentPath,
    system,
    fileSystem,
    systems,
    username,
    fileUploadLimit,
    remoteFsError,
    accountName,
  }: any = useLoaderData()
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
      remoteFsError={remoteFsError}
      accountName={accountName}
    />
  )
}

export function ErrorBoundary() {
  const error = useRouteError()
  logger.error(error)
  return <ErrorView error={error} />
}
