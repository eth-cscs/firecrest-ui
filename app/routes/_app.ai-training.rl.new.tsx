/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { useMemo } from 'react'
import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router'
import { redirect, useActionData, useLoaderData, useRouteError } from 'react-router'
// helpers
import { logInfoHttp } from '~/helpers/log-helper'
import { LogAction, LogPage } from '~/helpers/log-labels'
import { getErrorFromData } from '~/helpers/error-helper'
import { handleFormErrorResponse } from '~/helpers/response-helper'
import { notifySuccessMessage } from '~/helpers/notification-helper'
import { buildTrainingScript } from '~/modules/ai-training/helpers/rl-recipe-helper'
import { getLaunchPrefill, parseCloneSource } from '~/modules/ai-training/helpers/rl-runs-helper'
import { getNemoRlBlueprintCatalog } from '~/modules/ai-training/helpers/nemo-rl-blueprints.server'
import { getRlRunHistory } from '~/modules/ai-training/helpers/rl-runs.server'
import { getRlRecipe, getRlRecipes } from '~/modules/ai-training/recipes/rl-recipes'
// utils
import { getAuthAccessToken, getAuthUser, requireAuth } from '~/utils/auth.server'
// apis
import { postJob } from '~/apis/compute-api'
import { getSystems } from '~/apis/status-api'
// types
import type { PostJobPayload } from '~/types/api-compute'
import type { TrainingRecipe } from '~/types/ai-training'
// validations
import { validateRlTrainingLaunch } from '~/validations/aiTrainingValidation'
// views
import ErrorView from '~/components/views/ErrorView'
import RLView from '~/modules/ai-training/components/views/RLView'

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { auth } = await requireAuth(request)
  logInfoHttp({
    eventAction: LogPage.AI_TRAINING_RL_NEW,
    request: request,
    extraInfo: { username: auth.user.username },
  })
  const accessToken = await getAuthAccessToken(request)
  const [{ systems }, nemoRl] = await Promise.all([
    getSystems(accessToken, request),
    getNemoRlBlueprintCatalog(),
  ])
  return {
    formData: {
      systems: systems,
      username: auth.user.username,
    },
    nemoRl,
    clone: await getClone(new URL(request.url).searchParams.get('from'), getRlRecipes(nemoRl)),
  }
}

// A new run can start from a published one (?from=<recipe id>/<run id>). If that run can't be
// found, the form starts empty with a message rather than failing the page.
const getClone = async (from: string | null, recipes: TrainingRecipe[]) => {
  if (from === null) return null
  const source = parseCloneSource(from, recipes)
  if (!source) return { prefill: null, error: 'The run to start from is not valid.' }
  const { runs, unavailableRecipeIds } = await getRlRunHistory([
    getRlRecipe(recipes, source.recipeId)!,
  ])
  const run = runs.find((r) => r.runId === source.runId)
  const prefill = run ? getLaunchPrefill(run, recipes) : null
  if (prefill) return { prefill, error: null }
  return {
    prefill: null,
    error:
      unavailableRecipeIds.length > 0
        ? 'The run history could not be loaded, so the run to start from is not available.'
        : 'The run to start from was not found in the run history.',
  }
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const headers = new Headers()
  const accessToken = await getAuthAccessToken(request, headers)
  const authUser = await getAuthUser(request)
  try {
    const formData = await request.formData()
    const recipes = getRlRecipes(await getNemoRlBlueprintCatalog())
    const launch = validateRlTrainingLaunch(formData, recipes)
    const payload: PostJobPayload = {
      job: {
        script: buildTrainingScript(launch),
        name: launch.jobOptions.jobName,
        working_directory: launch.workingDirectory,
        account: launch.account,
        partition: launch.jobOptions.partition,
        reservation: launch.jobOptions.reservation,
      },
    }
    const requestId = crypto.randomUUID()
    const responseJob = await postJob(accessToken, launch.system, payload, request, requestId)
    const jobId = responseJob.jobId
    logInfoHttp({
      eventAction: LogAction.AI_TRAINING_RL_LAUNCH,
      request,
      requestId,
      extraInfo: {
        username: authUser?.username,
        system: launch.system,
        account: launch.account,
        jobId,
        'firecrest.aiTraining.recipe': launch.recipe.id,
        'firecrest.aiTraining.model': launch.model.id,
        'firecrest.aiTraining.environment': launch.environment.id,
        'firecrest.aiTraining.preset': launch.preset?.id,
        'firecrest.aiTraining.monitoring': launch.monitoring.destination.id,
        'firecrest.aiTraining.runTracking': launch.runTracking,
      },
    })
    await notifySuccessMessage(
      {
        title: 'Training launched',
        text: `${launch.recipe.name} training job created with id <${jobId}>`,
      },
      request,
      headers,
    )
    return redirect(`/compute/systems/${launch.system}/accounts/${launch.account}/jobs/${jobId}`, {
      headers: headers,
    })
  } catch (error) {
    return handleFormErrorResponse(error)
  }
}

export default function AiTrainingRlRoute() {
  const data = useActionData()
  const { formData, clone, nemoRl } = useLoaderData<typeof loader>()
  const recipes = useMemo(() => getRlRecipes(nemoRl), [nemoRl])
  return (
    <RLView
      formData={formData}
      recipes={recipes}
      recipesError={nemoRl.error}
      prefill={clone?.prefill ?? undefined}
      cloneError={clone?.error ?? undefined}
      error={getErrorFromData(data)}
    />
  )
}

export function ErrorBoundary() {
  const error = useRouteError()
  console.error(error)
  return <ErrorView error={error} />
}
