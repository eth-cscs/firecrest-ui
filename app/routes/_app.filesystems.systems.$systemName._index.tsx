/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { useEffect } from 'react'
import { useLoaderData, useLocation, useNavigate, useRouteError } from 'react-router'
import type { LoaderFunctionArgs } from 'react-router'
// loggers
// helpers
import { logInfoHttp } from '~/helpers/log-helper'
import { LogPage } from '~/helpers/log-labels'
// utils
import { requireAuth } from '~/utils/auth.server'
// contexts
import { useGroup } from '~/contexts/GroupContext'
// views
import ErrorView from '~/components/views/ErrorView'
// spinners
import LoadingSpinner from '~/components/spinners/LoadingSpinner'
// alerts
import AlertWarning from '~/components/alerts/AlertWarning'

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  // Check authentication only — groups are fetched client-side by the parent
  // layout's GroupsFetcher (see _app.filesystems.systems.$systemName.tsx).
  const { auth } = await requireAuth(request)
  const systemName = params.systemName!
  logInfoHttp({
    eventAction: LogPage.FILESYSTEM_INDEX,
    request: request,
    extraInfo: { username: auth.user.username, system: systemName },
  })
  return { systemName }
}

export default function AppFilesystemsSystemIndexRoute() {
  const { systemName } = useLoaderData<typeof loader>()
  const { selectedGroup, isLoadingGroups, groups } = useGroup()
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

  // Groups finished loading (successfully or not) but there's still nothing to select - a stuck
  // "Loading..." spinner would otherwise be indistinguishable from a genuinely slow fetch.
  if (!isLoadingGroups && groups.length === 0) {
    return (
      <AlertWarning title='No accounts found' className='m-6'>
        Unable to load accounts for system &quot;{systemName}&quot;. Please try again later or
        contact support if the issue persists.
      </AlertWarning>
    )
  }

  return <LoadingSpinner title='Loading...' className='py-10' />
}

export function ErrorBoundary() {
  const error = useRouteError()
  console.error(error)
  return <ErrorView error={error} />
}
