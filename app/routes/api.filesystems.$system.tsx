/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import _ from 'lodash'
import type { LoaderFunctionArgs } from 'react-router'
// helpers
import {
  searchSystemByName,
  getFileSystemByTargetPath,
} from '~/modules/status/helpers/system-helper'
import { getHealthyFileSystemSystems } from '~/helpers/system-helper'
import { handleApiErrorResponse, handleSuccessResponse } from '~/helpers/response-helper'
// utils
import { getAuthAccessToken, getAuthUser } from '~/utils/auth.server'
// apis
import { getSystems } from '~/apis/status-api'
import { getOpsLs } from '~/apis/filesystem-api'

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  // Create a headers object
  const headers = new Headers()
  // Authenticate the request and get the accessToken back, this will be the
  // already saved token or the refreshed one, in that case the headers above
  // will have the Set-Cookie header appended
  const accessToken = await getAuthAccessToken(request, headers)
  try {
    const user = await getAuthUser(request)
    const username = user.username
    // Get path params
    const systemName = params.system
    // Get url params
    const url = new URL(request.url)
    const targetPath = url.searchParams.get('targetPath')
    // Validate system name
    if (systemName === undefined || _.isEmpty(systemName)) {
      throw new Error('System not specified')
    }
    // Call api/s and fetch data
    const { systems } = await getSystems(accessToken, request)
    const activeSystems = getHealthyFileSystemSystems(systems)
    // Get system
    const system = searchSystemByName(activeSystems, systemName)
    // Get file system & path
    const { fileSystem, path } = getFileSystemByTargetPath(system, targetPath, username)
    // Call api/s and fetch data
    const { output } = await getOpsLs(accessToken, systemName, path, request)
    // Get file system
    return handleSuccessResponse({
      files: output,
      currentPath: path,
      system: system,
      fileSystem: fileSystem,
      systems: systems,
      username: username,
    })
  } catch (error) {
    return handleApiErrorResponse(error)
  }
}
