/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import type { LoaderFunction, ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node'
import {
  redirect,
  unstable_composeUploadHandlers,
  unstable_createMemoryUploadHandler,
  unstable_parseMultipartFormData,
} from '@remix-run/node'
import { useLoaderData, useActionData, useRouteError } from '@remix-run/react'
// types
import { convertPostJobFormToApiPayload, type PostJobFormPayload } from '~/types/api-compute'
// utils
import { getAuthAccessToken, authenticator } from '~/utils/auth.server'
// helpers
import { logInfoHttp } from '~/helpers/log-helper'
import { getErrorFromData } from '~/helpers/error-helper'
import { handleFormErrorResponse } from '~/helpers/response-helper'
import { notifySuccessMessage } from '~/helpers/notification-helper'
// apis
import { postJob } from '~/apis/compute-api'
import { getSystems } from '~/apis/status-api'
// validations
import { validateJob } from '~/validations/computeValidation'
// views
import ErrorView from '~/components/views/ErrorView'
import JobSubmitView from '~/modules/compute/components/views/JobSubmitView'

export const loader: LoaderFunction = async ({ request, params }: LoaderFunctionArgs) => {
  // Check authentication
  const auth = await authenticator.isAuthenticated(request, {
    failureRedirect: '/login',
  })
  logInfoHttp({
    message: 'Compute submit page',
    request: request,
    extraInfo: { username: auth.user.username },
  })
  // Get auth access token
  const accessToken = await getAuthAccessToken(request)
  // Get params
  const systemName = params.systemName!
  const accountName = params.accountName!
  // Call api/s and fetch data
  const { systems } = await getSystems(accessToken)
  // Return response (deferred response)
  return {
    formData: {
      systems: systems,
      username: auth.user.username,
      systemName: systemName,
      accountName: accountName,
    },
  }
}

export const action = async ({ request, params }: ActionFunctionArgs) => {
  // Create a headers object
  const headers = new Headers()
  // Authenticate the request and get the accessToken back, this will be the
  // already saved token or the refreshed one, in that case the headers above
  // will have the Set-Cookie header appended
  const accessToken = await getAuthAccessToken(request, headers)
  // Get params
  const systemName = params.systemName!
  const accountName = params.accountName!
  try {
    // Instance handler
    const uploadHandler = unstable_composeUploadHandlers(
      unstable_createMemoryUploadHandler({
        maxPartSize: 1_000_000,
      }),
    )
    // Get form data
    const formData = await unstable_parseMultipartFormData(request, uploadHandler)
    // Validate
    const formPayload: PostJobFormPayload = await validateJob(formData)
    // Payload
    const payload = await convertPostJobFormToApiPayload(formPayload)
    // Post data
    const responseJob = await postJob(accessToken, formPayload.system, payload)
    const jobId = responseJob.jobId
    // Notify success message
    await notifySuccessMessage(
      {
        title: 'Job submission',
        text: `Job created successfully with id <${jobId}>`,
      },
      request,
      headers,
    )
    // Redirect with headers
    return redirect(`/compute/systems/${systemName}/accounts/${accountName}`, {
      headers: headers,
    })
  } catch (error) {
    return handleFormErrorResponse(error)
  }
}

export default function AppComputeJobsNewUploadRoute() {
  const data = useActionData()
  const { formData }: any = useLoaderData()
  return <JobSubmitView formData={formData} error={getErrorFromData(data)} />
}

export function ErrorBoundary() {
  const error = useRouteError()
  return <ErrorView error={error} />
}
