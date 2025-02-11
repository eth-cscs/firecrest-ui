/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { captureRemixErrorBoundaryError } from '@sentry/remix'
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

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
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
  // Call api/s and fetch data
  const { systems } = await getSystems(accessToken)
  // Return response (deferred response)
  return {
    formData: {
      systems: systems,
      username: auth.user.username,
    },
  }
}

export const action = async ({ request }: ActionFunctionArgs) => {
  // Create a headers object
  const headers = new Headers()
  // Authenticate the request and get the accessToken back, this will be the
  // already saved token or the refreshed one, in that case the headers above
  // will have the Set-Cookie header appended
  const accessToken = await getAuthAccessToken(request, headers)
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
    return redirect(`/compute`, {
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
  captureRemixErrorBoundaryError(error)
  return <ErrorView error={error} />
}
