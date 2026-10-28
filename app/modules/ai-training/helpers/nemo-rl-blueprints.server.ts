/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import aiTrainingConfig from '~/configs/ai-training.config'
import logger from '~/logger/logger.server'
import {
  COMMIT_PATTERN,
  NEMO_RL_BLUEPRINTS_PATH,
  REPOSITORY_PATTERN,
  type NemoRlBlueprintCatalog,
  type NemoRlBlueprintSource,
  parseBlueprintIndex,
} from '~/modules/ai-training/recipes/nemo-rl-blueprints'

const REQUEST_TIMEOUT_MS = 10 * 1000
// The index is pinned to a commit, so a loaded one never changes; a failure is retried soon
const FAILURE_RETRY_MS = 60 * 1000

const UNAVAILABLE = 'NeMo-RL blueprints could not be loaded, so NeMo-RL recipes are not offered.'

let cached: { key: string; catalog: NemoRlBlueprintCatalog; expiresAt: number } | null = null

const fetchCatalog = async (source: NemoRlBlueprintSource): Promise<NemoRlBlueprintCatalog> => {
  const url = `https://raw.githubusercontent.com/${source.repository}/${source.commit}/${NEMO_RL_BLUEPRINTS_PATH}`
  const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
  if (!response.ok) throw new Error(`Blueprint index request failed with HTTP ${response.status}`)
  const { blueprints, skipped } = parseBlueprintIndex(await response.json())
  if (skipped.length > 0) {
    logger.warn(
      { 'firecrest.aiTraining.blueprints.skipped': skipped },
      'NeMo-RL blueprints skipped',
    )
  }
  return { source, blueprints, error: blueprints.length > 0 ? null : UNAVAILABLE }
}

// The NeMo-RL blueprints the pages offer. Never throws: without them, other recipes still work.
export const getNemoRlBlueprintCatalog = async (): Promise<NemoRlBlueprintCatalog> => {
  const source: NemoRlBlueprintSource = {
    repository: String(aiTrainingConfig.nemoRlBlueprintsRepository),
    commit: String(aiTrainingConfig.nemoRlBlueprintsCommit),
  }
  if (!REPOSITORY_PATTERN.test(source.repository) || !COMMIT_PATTERN.test(source.commit)) {
    logger.error('NeMo-RL blueprints: the configured repository or commit is not valid')
    return { source, blueprints: [], error: UNAVAILABLE }
  }
  const key = `${source.repository}@${source.commit}`
  if (cached && cached.key === key && Date.now() < cached.expiresAt) return cached.catalog
  let catalog: NemoRlBlueprintCatalog
  try {
    catalog = await fetchCatalog(source)
  } catch (error) {
    logger.warn({ err: error }, 'NeMo-RL blueprints could not be loaded')
    catalog = { source, blueprints: [], error: UNAVAILABLE }
  }
  cached = {
    key,
    catalog,
    expiresAt: catalog.error ? Date.now() + FAILURE_RETRY_MS : Number.POSITIVE_INFINITY,
  }
  return catalog
}
