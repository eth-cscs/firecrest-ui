/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { StatusCodes } from 'http-status-codes'

export function safeRedirect(to: string | null | undefined, defaultRedirect = '/') {
  if (!to) return defaultRedirect
  // Allow only relative paths (no http(s)://, no //example.com)
  if (!to.startsWith('/') || to.startsWith('//')) return defaultRedirect
  return to
}

export function isRedirectResponse(response: Response) {
  // A redirect response is a response with a 3xx status code and a Location header
  return (
    response.status >= StatusCodes.MULTIPLE_CHOICES &&
    response.status < StatusCodes.BAD_REQUEST &&
    response.headers.has('Location')
  )
}
