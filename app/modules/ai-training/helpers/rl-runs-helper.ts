/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import {
  TIME_LIMIT_PATTERN,
  formatHyperparameterValue,
  getActiveHyperparameters,
  getDefaultHyperparameters,
  getHyperparameterPreset,
  isNodeCountConfigurable,
  parseHyperparameterValue,
} from '~/modules/ai-training/helpers/rl-recipe-helper'
import { getRlRecipe } from '~/modules/ai-training/recipes/rl-recipes'
import type {
  HyperparameterDefinition,
  HyperparameterValue,
  RlLaunchPrefill,
  RlRunStatus,
  RlRunSummary,
  TrainingRecipe,
} from '~/types/ai-training'

// The run history is read from the public records the collector publishes. They are checked
// again here, as they come from outside this app: unknown shapes are dropped, never trusted.
const SAFE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/
const JOB_ID_PATTERN = /^\d{1,20}$/
// <cluster>-<job id>
export const RL_RUN_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}-\d{1,20}$/
const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const RUN_STATUSES: RlRunStatus[] = [
  'completed',
  'failed',
  'terminated',
  'preempted',
  'running',
  'unknown',
]

type JsonObject = Record<string, unknown>

const isObject = (value: unknown): value is JsonObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const safeId = (value: unknown) =>
  typeof value === 'string' && SAFE_ID_PATTERN.test(value) ? value : null

const day = (value: unknown) =>
  typeof value === 'string' && DAY_PATTERN.test(value) ? value : null

const integer = (value: unknown) => (Number.isInteger(value) ? (value as number) : null)

const toHyperparameters = (value: unknown) => {
  const hyperparameters: Record<string, HyperparameterValue> = {}
  if (!isObject(value)) return hyperparameters
  Object.entries(value).forEach(([key, parameter]) => {
    if (
      (typeof parameter === 'number' && Number.isFinite(parameter)) ||
      typeof parameter === 'boolean' ||
      typeof parameter === 'string'
    ) {
      hyperparameters[key] = parameter
    }
  })
  return hyperparameters
}

const toMetrics = (value: unknown) => {
  if (!isObject(value)) return null
  const metrics: Record<string, number> = {}
  Object.entries(value).forEach(([key, metric]) => {
    if (typeof metric === 'number' && Number.isFinite(metric)) metrics[key] = metric
  })
  return metrics
}

// Reads a recipe's index.json; entries that don't have the expected shape are left out
export const parseRunIndex = (recipeId: string, data: unknown): RlRunSummary[] => {
  if (!isObject(data) || !Array.isArray(data.runs)) return []
  return data.runs.filter(isObject).flatMap((entry: JsonObject): RlRunSummary[] => {
    const status = entry.status as RlRunStatus
    const cluster = safeId(entry.cluster)
    const jobId =
      typeof entry.jobId === 'string' && JOB_ID_PATTERN.test(entry.jobId) ? entry.jobId : null
    if (
      !cluster ||
      !jobId ||
      entry.runId !== `${cluster}-${jobId}` ||
      !RUN_STATUSES.includes(status)
    ) {
      return []
    }
    return [
      {
        recipeId,
        runId: entry.runId,
        cluster,
        jobId,
        status,
        startedOn: day(entry.startedOn),
        endedOn: day(entry.endedOn),
        elapsedSeconds: integer(entry.elapsedSeconds),
        recipeVersion: safeId(entry.recipeVersion),
        model: safeId(entry.model),
        environment: safeId(entry.environment),
        preset: safeId(entry.preset),
        hyperparameters: toHyperparameters(entry.hyperparameters),
        monitoring: safeId(entry.monitoring),
        nodes: integer(entry.nodes),
        gpusPerNode: integer(entry.gpusPerNode),
        timeLimit:
          typeof entry.timeLimit === 'string' && TIME_LIMIT_PATTERN.test(entry.timeLimit)
            ? entry.timeLimit
            : null,
        metrics: toMetrics(entry.metrics),
      },
    ]
  })
}

// Newest first across recipes; within a day (start times are only known to the day), in a
// stable order
export const sortRuns = (runs: RlRunSummary[]) =>
  [...runs].sort(
    (a, b) =>
      (b.startedOn ?? '').localeCompare(a.startedOn ?? '') ||
      a.recipeId.localeCompare(b.recipeId) ||
      a.runId.localeCompare(b.runId),
  )

// Through the route that looks up the job's account, which the job view's URL needs
export const getJobUrl = (run: RlRunSummary) =>
  `/compute/systems/${encodeURIComponent(run.cluster)}/jobs/${run.jobId}`

export const getCloneUrl = (run: RlRunSummary) =>
  `/ai-training/rl/new?from=${encodeURIComponent(`${run.recipeId}/${run.runId}`)}`

// Parses the `from` parameter of the launch page: <recipe id>/<run id>, for a known recipe
export const parseCloneSource = (value: string | null, recipes: TrainingRecipe[]) => {
  const [recipeId, runId, ...rest] = (value ?? '').split('/')
  if (rest.length > 0 || !getRlRecipe(recipes, recipeId) || !RL_RUN_ID_PATTERN.test(runId ?? '')) {
    return null
  }
  return { recipeId, runId }
}

const getRunContext = (run: RlRunSummary, recipes: TrainingRecipe[]) => {
  const recipe = getRlRecipe(recipes, run.recipeId)
  if (!recipe) return null
  const model = recipe.models.find((m) => m.id === run.model)
  const environment = recipe.environments.find((e) => e.id === run.environment)
  const preset = run.preset ? getHyperparameterPreset(recipe, run.preset) : undefined
  return { recipe, model, environment, preset }
}

export interface ChangedHyperparameter {
  key: string
  label: string
  value: string
}

// The values a run changed from the defaults of its recipe, model and preset, as the recipe
// defines them today
export const getChangedHyperparameters = (
  run: RlRunSummary,
  recipes: TrainingRecipe[],
): ChangedHyperparameter[] => {
  const context = getRunContext(run, recipes)
  if (!context) return []
  const { recipe, model, preset } = context
  const defaults = getDefaultHyperparameters(recipe, model, preset)
  return getActiveHyperparameters(recipe, preset)
    .filter((definition: HyperparameterDefinition) => definition.key in run.hyperparameters)
    .map((definition: HyperparameterDefinition) => ({
      definition,
      value: formatHyperparameterValue(run.hyperparameters[definition.key], definition.type),
    }))
    .filter(
      ({ definition, value }) =>
        defaults[definition.key] === undefined ||
        value !== formatHyperparameterValue(defaults[definition.key], definition.type),
    )
    .map(({ definition, value }) => ({ key: definition.key, label: definition.label, value }))
}

export const getRecipeName = (recipeId: string, recipes: TrainingRecipe[]) =>
  getRlRecipe(recipes, recipeId)?.name ?? recipeId

export const getModelName = (run: RlRunSummary, recipes: TrainingRecipe[]) =>
  getRunContext(run, recipes)?.model?.name ?? run.model ?? 'Unknown model'

export const getEnvironmentName = (run: RlRunSummary, recipes: TrainingRecipe[]) =>
  getRunContext(run, recipes)?.environment?.name ?? run.environment ?? 'Unknown dataset'

export const getPresetName = (run: RlRunSummary, recipes: TrainingRecipe[]) =>
  getRunContext(run, recipes)?.preset?.name ?? run.preset

export const isCurrentRecipeVersion = (run: RlRunSummary, recipe: TrainingRecipe | undefined) =>
  !run.recipeVersion || !recipe?.version || run.recipeVersion === recipe.version

export const shortVersion = (version: string) =>
  /^[0-9a-f]{40}$/.test(version) ? version.slice(0, 7) : version

// The launch form's selections and values for a new run that starts from a published one.
// Whatever no longer fits the recipe as it is today falls back to the defaults, with a note.
export const getLaunchPrefill = (
  run: RlRunSummary,
  recipes: TrainingRecipe[],
): RlLaunchPrefill | null => {
  const context = getRunContext(run, recipes)
  if (!context) return null
  const { recipe, model, environment, preset } = context
  const notes: string[] = []

  if (!isCurrentRecipeVersion(run, recipe)) {
    notes.push(
      `The run used ${recipe.name} version ${shortVersion(run.recipeVersion!)}; new runs use ${shortVersion(recipe.version!)}.`,
    )
  }
  if (!model) notes.push(`Its model (${run.model ?? 'unknown'}) is no longer offered: choose one.`)
  if (!environment) {
    notes.push(`Its dataset (${run.environment ?? 'unknown'}) is no longer offered: choose one.`)
  }
  const hasPresets = !!recipe.hyperparameterPresets?.length
  if (hasPresets && !preset) {
    notes.push(`Its preset (${run.preset ?? 'none'}) is no longer offered: choose one.`)
  }
  const monitoringDestination = recipe.monitoringDestinations.find((d) => d.id === run.monitoring)

  const defaults = getDefaultHyperparameters(recipe, model, preset)
  const hyperparameterValues: Record<string, string> = {}
  const editedKeys: string[] = []
  const invalidLabels: string[] = []
  let hasPathDefinitions = false
  const activeDefinitions = getActiveHyperparameters(recipe, preset)
  activeDefinitions.forEach((definition: HyperparameterDefinition) => {
    const defaultValue = formatHyperparameterValue(defaults[definition.key], definition.type)
    hyperparameterValues[definition.key] = defaultValue
    if (definition.type === 'path') hasPathDefinitions = true
    if (!(definition.key in run.hyperparameters)) return
    const value = formatHyperparameterValue(run.hyperparameters[definition.key], definition.type)
    if ('error' in parseHyperparameterValue(definition, value)) {
      invalidLabels.push(definition.label)
      return
    }
    hyperparameterValues[definition.key] = value
    if (value !== defaultValue) editedKeys.push(definition.key)
  })
  if (invalidLabels.length > 0) {
    notes.push(
      `Recorded values that are no longer valid were replaced by defaults: ${invalidLabels.join(', ')}.`,
    )
  }
  const activeKeys = activeDefinitions.map((definition) => definition.key)
  const unknownCount = Object.keys(run.hyperparameters).filter(
    (key) => !activeKeys.includes(key),
  ).length
  if (unknownCount > 0) {
    notes.push(`${unknownCount} recorded values no longer exist in the recipe and were ignored.`)
  }
  if (hasPathDefinitions) notes.push('Paths are not recorded with runs: check them in step 4.')
  if (monitoringDestination && monitoringDestination.parameters.length > 0) {
    notes.push('Monitoring settings are not recorded with runs: fill them in in step 5.')
  }

  return {
    run,
    recipeId: recipe.id,
    modelId: model?.id ?? null,
    environmentId: environment?.id ?? null,
    presetId: preset?.id ?? null,
    monitoringDestinationId: monitoringDestination?.id ?? null,
    hyperparameterValues,
    editedKeys,
    nodes: isNodeCountConfigurable(recipe) && run.nodes !== null ? String(run.nodes) : null,
    timeLimit: run.timeLimit,
    notes,
  }
}

// e.g. 2h 05m, 2m 16s
export const formatDuration = (seconds: number | null) => {
  if (seconds === null) return null
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`
  if (minutes > 0) return `${minutes}m ${String(seconds % 60).padStart(2, '0')}s`
  return `${seconds}s`
}

export const formatMetric = (value: number) =>
  Number.isInteger(value) ? String(value) : value.toPrecision(4).replace(/\.?0+$/, '')
