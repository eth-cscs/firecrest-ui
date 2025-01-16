import _ from 'lodash'
import type { LoaderFunctionArgs, LoaderFunction } from '@remix-run/node'
// helpers
import {
  getDefaultFileSystemFromSystem,
  searchFileSystemByPath,
  searchSystemByName,
} from '~/modules/status/helpers/system-helper'
import { getHealthyFileSystemSystems } from '~/helpers/system-helper'
import { handleApiErrorResponse, handleSuccessResponse } from '~/helpers/response-helper'
// utils
import { getAuthAccessToken, getAuthUser } from '~/utils/auth.server'
// apis
import { getSystems } from '~/apis/status-api'
import { getOpsLs } from '~/apis/filesystem-api'

export const loader: LoaderFunction = async ({ params, request }: LoaderFunctionArgs) => {
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
    // Local variables
    let path = targetPath
    // Validate system name
    if (systemName === undefined || _.isEmpty(systemName)) {
      throw new Error('System not specified')
    }
    // Call api/s and fetch data
    const { systems } = await getSystems(accessToken)
    const activeSystems = getHealthyFileSystemSystems(systems)
    // Get system
    const system = searchSystemByName(activeSystems, systemName)
    // Get file system & path
    let fileSystem = null
    if (targetPath === undefined || _.isEmpty(targetPath)) {
      fileSystem = getDefaultFileSystemFromSystem(system)
      path = fileSystem.path
      if (fileSystem.defaultWorkDir) {
        path = `${fileSystem.path}/${username}`
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
