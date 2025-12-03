/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import _ from 'lodash'
import type { LoaderFunction, LoaderFunctionArgs } from '@remix-run/node'
import { useRouteError } from '@remix-run/react'
import { redirect } from '@remix-run/node'
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
// apis
import { getSystems, getUserInfo } from '~/apis/status-api'
import { getOpsLs } from '~/apis/filesystem-api'
// views
import ErrorView from '~/components/views/ErrorView'
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
  // Get path params
  const systemName = params.systemName!
  // Get url params
  const url = new URL(request.url)
  const targetPath = url.searchParams.get('targetPath')
  // Get auth access token
  const accessToken = await getAuthAccessToken(request)
  // Call api/s and fetch data
  const { group } = await getUserInfo(accessToken, systemName)
  // Redirect to default account if no account specified
  if (targetPath == null || _.isEmpty(targetPath)) {
    return redirect(`/filesystems/systems/${systemName}/accounts/${group.name}`)
  } else {
    return redirect(
      `/filesystems/systems/${systemName}/accounts/${group.name}?targetPath=${encodeURIComponent(targetPath)}`,
    )
  }
}

export function ErrorBoundary() {
  const error = useRouteError()
  logger.error(error)
  return <ErrorView error={error} />
}
