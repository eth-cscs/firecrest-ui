/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { json } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import type { LinksFunction, LoaderFunction, LoaderFunctionArgs } from '@remix-run/node'
// styles
import stylesheet from '~/styles/app.css?url'
// configs
import base from '~/configs/base.config'
// apis
import { getSystems } from '~/apis/status-api'
// layouts
import AppLayout from '~/layouts/AppLayout'
// helpers
import { getNotificationMessage } from '~/helpers/notification-helper'
// utils
import { authenticator, getAuthAccessToken } from '~/utils/auth.server'
import { SystemProvider } from '~/contexts/SystemContext'

export const links: LinksFunction = () => [{ rel: 'stylesheet', href: stylesheet }]

export const loader: LoaderFunction = async ({ request, params }: LoaderFunctionArgs) => {
  // Check authentication
  const auth = await authenticator.isAuthenticated(request, {
    failureRedirect: '/login',
  })
  // Get auth access token
  const accessToken = await getAuthAccessToken(request)
  // Get path params
  const systemName = params.systemName || null
  // Create a headers object
  const headers = new Headers()
  // Get notification messages
  const notificationMessages = await getNotificationMessage(request, headers)
  // Call api/s and fetch data
  const { systems } = await getSystems(accessToken)
  // Return json
  return json(
    {
      environment: base.environment,
      appName: base.appName,
      appVersion: base.appVersion,
      companyName: base.companyName,
      supportUrl: base.supportUrl,
      repoUrl: base.repoUrl,
      docUrl: base.docUrl,
      logoPath: base.logoPath,
      authUser: auth.user,
      notificationMessages: notificationMessages,
      systems: systems,
      systemName,
    },
    {
      headers: headers,
    },
  )
}

export default function AppLayoutRoute() {
  const data = useLoaderData()
  const {
    appName,
    appVersion,
    companyName,
    logoPath,
    supportUrl,
    repoUrl,
    docUrl,
    environment,
    authUser,
    notificationMessages,
    systems,
    systemName,
  }: any = data
  return (
    <SystemProvider systems={systems} systemName={systemName}>
      <AppLayout
        appName={appName}
        environment={environment}
        appVersion={appVersion}
        companyName={companyName}
        logoPath={logoPath}
        supportUrl={supportUrl}
        repoUrl={repoUrl}
        docUrl={docUrl}
        authUser={authUser}
        notificationMessages={notificationMessages}
      />
    </SystemProvider>
  )
}
