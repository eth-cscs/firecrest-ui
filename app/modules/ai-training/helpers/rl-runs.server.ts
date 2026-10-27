/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import aiTrainingConfig from '~/configs/ai-training.config'
import { parseRunIndex, sortRuns } from '~/modules/ai-training/helpers/rl-runs-helper'
import type { RlRunSummary, TrainingRecipe } from '~/types/ai-training'

const REQUEST_TIMEOUT_MS = 10 * 1000

// A recipe without published runs has no index.json yet, which is not an error
const fetchRunIndex = async (recipeId: string): Promise<RlRunSummary[]> => {
  const baseUrl = String(aiTrainingConfig.rlRunsUrl).replace(/\/+$/, '')
  const response = await fetch(`${baseUrl}/${encodeURIComponent(recipeId)}/index.json`, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  if (response.status === 404) return []
  if (!response.ok) throw new Error(`Run history request failed with HTTP ${response.status}`)
  return parseRunIndex(recipeId, await response.json())
}

export interface RlRunHistory {
  runs: RlRunSummary[]
  // Recipes whose history could not be loaded
  unavailableRecipeIds: string[]
}

// The published runs of the given recipes, newest first
export const getRlRunHistory = async (recipes: TrainingRecipe[]): Promise<RlRunHistory> => {
  const results = await Promise.allSettled(recipes.map((recipe) => fetchRunIndex(recipe.id)))
  const runs: RlRunSummary[] = []
  const unavailableRecipeIds: string[] = []
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') runs.push(...result.value)
    else unavailableRecipeIds.push(recipes[index].id)
  })
  return { runs: sortRuns(runs), unavailableRecipeIds }
}
