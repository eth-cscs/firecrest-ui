/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { useMemo } from 'react'
import type { LoaderFunctionArgs } from 'react-router'
import { useLoaderData, useRouteError } from 'react-router'
// helpers
import { logInfoHttp } from '~/helpers/log-helper'
import { LogPage } from '~/helpers/log-labels'
import { getNemoRlBlueprintCatalog } from '~/modules/ai-training/helpers/nemo-rl-blueprints.server'
import { getRlRunHistory } from '~/modules/ai-training/helpers/rl-runs.server'
import { getRlRecipes } from '~/modules/ai-training/recipes/rl-recipes'
// utils
import { requireAuth } from '~/utils/auth.server'
// views
import ErrorView from '~/components/views/ErrorView'
import RLRunsView from '~/modules/ai-training/components/views/RLRunsView'

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { auth } = await requireAuth(request)
  logInfoHttp({
    eventAction: LogPage.AI_TRAINING_RL,
    request: request,
    extraInfo: { username: auth.user.username },
  })
  const nemoRl = await getNemoRlBlueprintCatalog()
  // The page works without the history: new runs can still be started
  const history = await getRlRunHistory(getRlRecipes(nemoRl))
  return { ...history, nemoRl }
}

export default function AiTrainingRlRunsRoute() {
  const { runs, unavailableRecipeIds, nemoRl } = useLoaderData<typeof loader>()
  const recipes = useMemo(() => getRlRecipes(nemoRl), [nemoRl])
  return (
    <RLRunsView
      runs={runs}
      unavailableRecipeIds={unavailableRecipeIds}
      recipes={recipes}
      recipesError={nemoRl.error}
    />
  )
}

export function ErrorBoundary() {
  const error = useRouteError()
  console.error(error)
  return <ErrorView error={error} />
}
