/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

const getProgressiveLoadingLimit = (request: any) => {
  const url = new URL(request.url)
  const progressiveLoadingLimit = url.searchParams.get('progressiveLoadingLimit')
  if (progressiveLoadingLimit) {
    return parseInt(progressiveLoadingLimit)
  }
  return null // default in the backend
}

export { getProgressiveLoadingLimit }
