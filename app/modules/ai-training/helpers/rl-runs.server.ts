/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import aiTrainingConfig from '~/configs/ai-training.config'
import { parseRunIndex, sortRuns } from '~/modules/ai-training/helpers/rl-runs-helper'
import type { RlRunSummary, TrainingRecipe } from '~/types/ai-training'

const REQUEST_TIMEOUT_MS = 10 * 1000

// raw.githubusercontent.com/<owner>/<repo>/<branch>
const RAW_GITHUB_BRANCH_PATTERN =
  /^https:\/\/raw\.githubusercontent\.com\/([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)\/([A-Za-z0-9_./-]+)$/
const COMMIT_PATTERN = /^[0-9a-f]{40}$/
// The GitHub API allows 60 requests an hour without a token
const COMMIT_LOOKUP_INTERVAL_MS = 2 * 60 * 1000

let branchHead: { commit: string; checkedAt: number } | null = null

// Each of GitHub's cache servers keeps a branch file for up to 5 minutes, so right after the
// collector pushes, consecutive requests can get the new index and then the old one again, and a
// run appears and disappears. Files are read at the commit the branch points to instead, which
// never change, looked up every few minutes. If the lookup fails, the last known commit is
// used, or else the branch.
const getRunsBaseUrl = async () => {
  const baseUrl = String(aiTrainingConfig.rlRunsUrl).replace(/\/+$/, '')
  const match = RAW_GITHUB_BRANCH_PATTERN.exec(baseUrl)
  if (!match) return baseUrl
  const [, repository, branch] = match
  if (!branchHead || Date.now() - branchHead.checkedAt > COMMIT_LOOKUP_INTERVAL_MS) {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${repository}/commits/${encodeURIComponent(branch)}`,
        {
          headers: { Accept: 'application/vnd.github.sha' },
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        },
      )
      const commit = response.ok ? (await response.text()).trim() : ''
      if (COMMIT_PATTERN.test(commit)) branchHead = { commit, checkedAt: Date.now() }
    } catch {
      // Falls back below
    }
  }
  return branchHead
    ? `https://raw.githubusercontent.com/${repository}/${branchHead.commit}`
    : baseUrl
}

// A recipe without published runs has no index.json yet, which is not an error
const fetchRunIndex = async (baseUrl: string, recipeId: string): Promise<RlRunSummary[]> => {
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
  const baseUrl = await getRunsBaseUrl()
  const results = await Promise.allSettled(
    recipes.map((recipe) => fetchRunIndex(baseUrl, recipe.id)),
  )
  const runs: RlRunSummary[] = []
  const unavailableRecipeIds: string[] = []
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') runs.push(...result.value)
    else unavailableRecipeIds.push(recipes[index].id)
  })
  return { runs: sortRuns(runs), unavailableRecipeIds }
}
