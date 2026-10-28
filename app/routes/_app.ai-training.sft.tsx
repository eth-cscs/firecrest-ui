/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { useRouteError } from 'react-router'
import type { LoaderFunctionArgs } from 'react-router'
// helpers
import { logInfoHttp } from '~/helpers/log-helper'
import { LogPage } from '~/helpers/log-labels'
// utils
import { requireAuth } from '~/utils/auth.server'
// views
import ErrorView from '~/components/views/ErrorView'
import SFTView from '~/modules/ai-training/components/views/SFTView'

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { auth } = await requireAuth(request)
  logInfoHttp({
    eventAction: LogPage.AI_TRAINING_SFT,
    request: request,
    extraInfo: { username: auth.user.username },
  })
  return {}
}

export default function AiTrainingSftRoute() {
  return <SFTView />
}

export function ErrorBoundary() {
  const error = useRouteError()
  console.error(error)
  return <ErrorView error={error} />
}
