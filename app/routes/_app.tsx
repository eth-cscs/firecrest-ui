import { json } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import type { LinksFunction, LoaderFunction, LoaderFunctionArgs } from '@remix-run/node'
// styles
import stylesheet from '~/styles/app.css?url'
// configs
import base from '~/configs/base.config'
// layouts
import AppLayout from '~/layouts/AppLayout'
// helpers
import { getNotificationMessage } from '~/helpers/notification-helper'
// utils
import { authenticator } from '~/utils/auth.server'

export const links: LinksFunction = () => [{ rel: 'stylesheet', href: stylesheet }]

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
  // Check authentication
  const auth = await authenticator.isAuthenticated(request, {
    failureRedirect: '/login',
  })
  // Create a headers object
  const headers = new Headers()
  // Get notification messages
  const notificationMessages = await getNotificationMessage(request, headers)
  // Return json
  return json(
    {
      environment: base.environment,
      appVersion: base.appVersion,
      companyName: base.companyName,
      supportUrl: base.supportUrl,
      authUser: auth.user,
      notificationMessages: notificationMessages,
    },
    {
      headers: headers,
    },
  )
}

export default function AppLayoutRoute() {
  const data = useLoaderData()
  const { appVersion, companyName, supportUrl, environment, authUser, notificationMessages }: any =
    data
  return (
    <AppLayout
      environment={environment}
      appVersion={appVersion}
      companyName={companyName}
      supportUrl={supportUrl}
      authUser={authUser}
      notificationMessages={notificationMessages}
    />
  )
}
