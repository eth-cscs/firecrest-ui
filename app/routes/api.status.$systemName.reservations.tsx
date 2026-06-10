/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import type { LoaderFunction, LoaderFunctionArgs } from '@remix-run/node'
// helpers
import { handleApiErrorResponse, handleSuccessResponse } from '~/helpers/response-helper'
// utils
import { getAuthAccessToken } from '~/utils/auth.server'
// apis
import { getReservations } from '~/apis/status-api'

export const loader: LoaderFunction = async ({ request, params }: LoaderFunctionArgs) => {
  const headers = new Headers()
  const accessToken = await getAuthAccessToken(request, headers)
  try {
    const systemName = params.systemName!
    const response = await getReservations(accessToken, systemName)
    return handleSuccessResponse(response, 200, headers)
  } catch (error) {
    return handleApiErrorResponse(error)
  }
}
