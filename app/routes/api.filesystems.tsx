/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import type { LoaderFunctionArgs, LoaderFunction } from '@remix-run/node'
// helpers
import {
  getDefaultFileSystemFromSystem,
  getDefaultSystemFromSystems,
} from '~/modules/status/helpers/system-helper'
import { getHealthyFileSystemSystems } from '~/helpers/system-helper'
import { handleApiErrorResponse, handleSuccessResponse } from '~/helpers/response-helper'
// utils
import { getAuthAccessToken, getAuthUser } from '~/utils/auth.server'
// apis
import { getSystems } from '~/apis/status-api'
import { getOpsLs } from '~/apis/filesystem-api'

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
  // Create a headers object
  const headers = new Headers()
  // Authenticate the request and get the accessToken back, this will be the
  // already saved token or the refreshed one, in that case the headers above
  // will have the Set-Cookie header appended
  const accessToken = await getAuthAccessToken(request, headers)
  try {
    const user = await getAuthUser(request)
    const username = user.username
    // Call api/s and fetch data
    const { systems } = await getSystems(accessToken)
    const activeSystems = getHealthyFileSystemSystems(systems)
    // Check if there is at least on system
    if (activeSystems && activeSystems.length <= 0) {
      throw new Error('No available systems')
    }
    // Get first file system home direc
    const system = getDefaultSystemFromSystems(activeSystems)
    const fileSystem = getDefaultFileSystemFromSystem(system)
    // Validation
    if (system === null || fileSystem === null) {
      throw new Error('Filesystem(s) configuration error')
    }
    let targetPath = fileSystem.path
    if (fileSystem.defaultWorkDir) {
      targetPath = `${fileSystem.path}/${username}`
    }
    // Call api/s and fetch data
    const { output } = await getOpsLs(accessToken, system.name, targetPath, request)
    // Get file system
    return handleSuccessResponse({
      files: output,
      currentPath: targetPath,
      system: system,
      fileSystem: fileSystem,
      systems: systems,
      username: username,
    })
  } catch (error) {
    return handleApiErrorResponse(error)
  }
}
