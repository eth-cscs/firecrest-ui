/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { useEffect } from 'react'
import { useLoaderData, useNavigate, useRouteError } from '@remix-run/react'
import type { LoaderFunction, LoaderFunctionArgs } from '@remix-run/node'
// loggers
import logger from '~/logger/logger'
// helpers
import { logInfoHttp } from '~/helpers/log-helper'
// utils
import { requireAuth, authenticator } from '~/utils/auth.server'
// contexts
import { useGroup } from '~/contexts/GroupContext'
// views
import ErrorView from '~/components/views/ErrorView'
// spinners
import LoadingSpinner from '~/components/spinners/LoadingSpinner'

export const loader: LoaderFunction = async ({ request, params }: LoaderFunctionArgs) => {
  // Check authentication only — groups are resolved client-side from the
  // deferred userInfoPromise already started by the parent layout loader.
  const { auth } = await requireAuth(request, authenticator)
  const systemName = params.systemName!
  logInfoHttp({
    message: `Compute system ${systemName} index page`,
    request: request,
    extraInfo: { username: auth.user.username },
  })
  return { systemName }
}

export default function AppComputeSystemIndexRoute() {
  const { systemName } = useLoaderData<typeof loader>()
  const { selectedGroup } = useGroup()
  const navigate = useNavigate()

  useEffect(() => {
    if (selectedGroup) {
      navigate(`/compute/systems/${systemName}/accounts/${selectedGroup.name}`, { replace: true })
    }
  }, [selectedGroup, systemName, navigate])

  return <LoadingSpinner title='Loading...' className='py-10' />
}

export function ErrorBoundary() {
  const error = useRouteError()
  logger.error(error)
  return <ErrorView error={error} />
}
