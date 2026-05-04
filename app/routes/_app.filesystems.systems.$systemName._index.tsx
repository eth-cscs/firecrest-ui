/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { useEffect } from 'react'
import { useLoaderData, useLocation, useNavigate, useRouteError } from '@remix-run/react'
import type { LoaderFunction, LoaderFunctionArgs } from '@remix-run/node'
// loggers
import logger from '~/logger/logger'
// helpers
import { logInfoHttp } from '~/helpers/log-helper'
// utils
import { requireAuth } from '~/utils/auth.server'
// contexts
import { useGroup } from '~/contexts/GroupContext'
// views
import ErrorView from '~/components/views/ErrorView'
// spinners
import LoadingSpinner from '~/components/spinners/LoadingSpinner'

export const loader: LoaderFunction = async ({ params, request }: LoaderFunctionArgs) => {
  // Check authentication only — groups are resolved client-side from the
  // deferred userInfoPromise already started by the parent layout loader.
  const { auth } = await requireAuth(request)
  const systemName = params.systemName!
  logInfoHttp({
    message: 'Filesystem index page',
    request: request,
    extraInfo: { username: auth.user.username },
  })
  return { systemName }
}

export default function AppFilesystemsSystemIndexRoute() {
  const { systemName } = useLoaderData<typeof loader>()
  const { selectedGroup } = useGroup()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (selectedGroup) {
      const targetPath = new URLSearchParams(location.search).get('targetPath')
      const base = `/filesystems/systems/${systemName}/accounts/${selectedGroup.name}`
      const to = targetPath ? `${base}?targetPath=${encodeURIComponent(targetPath)}` : base
      navigate(to, { replace: true })
    }
  }, [selectedGroup, systemName, navigate, location.search])

  return <LoadingSpinner title='Loading...' className='py-10' />
}

export function ErrorBoundary() {
  const error = useRouteError()
  logger.error(error)
  return <ErrorView error={error} />
}
