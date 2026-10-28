/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { ValidationError } from 'yup'
// types
import type {
  HyperparameterDefinition,
  HyperparameterPreset,
  HyperparameterValue,
  MonitoringParameter,
  ResolvedMonitoring,
  TrainingEnvironment,
  TrainingJobOptions,
  TrainingModel,
  TrainingRecipe,
} from '~/types/ai-training'
// recipes
import { getRlRecipe } from '~/modules/ai-training/recipes/rl-recipes'
// helpers
import {
  HYPERPARAMETER_FIELD_PREFIX,
  JOB_NAME_PATTERN,
  MONITORING_FIELD_PREFIX,
  TIME_LIMIT_PATTERN,
  getActiveHyperparameters,
  getHyperparameterPreset,
  parseHyperparameterValue,
  parseHyperparameters,
  resolveNodeCount,
  resolveMonitoring,
} from '~/modules/ai-training/helpers/rl-recipe-helper'

export interface RlTrainingLaunchPayload {
  system: string
  account: string
  workingDirectory: string
  recipe: TrainingRecipe
  model: TrainingModel
  environment: TrainingEnvironment
  hyperparameters: Record<string, HyperparameterValue>
  preset?: HyperparameterPreset
  monitoring: ResolvedMonitoring
  jobOptions: TrainingJobOptions
  runTracking: boolean
}

const getString = (formData: FormData, name: string) => {
  const value = formData.get(name)
  return typeof value === 'string' ? value.trim() : ''
}

// Everything that ends up in the batch script is resolved here from the server-side recipe
// catalog (by id) or validated against it - the client-side script preview is never trusted.
export const validateRlTrainingLaunch = (
  formData: FormData,
  recipes: TrainingRecipe[],
): RlTrainingLaunchPayload => {
  const errors: ValidationError[] = []
  const addError = (path: string, message: string, value: any = undefined) => {
    errors.push(new ValidationError(message, value, path))
  }

  const system = getString(formData, 'system')
  const account = getString(formData, 'account')
  const workingDirectory = getString(formData, 'workingDirectory')
  const jobName = getString(formData, 'jobName')
  const timeLimit = getString(formData, 'timeLimit')
  const partition = getString(formData, 'partition')
  const reservation = getString(formData, 'reservation')
  if (!system) addError('system', 'System is required')
  if (!account) addError('account', 'Account is required')
  if (!workingDirectory) addError('workingDirectory', 'Working directory is required')
  if (!JOB_NAME_PATTERN.test(jobName)) {
    addError('jobName', 'Job name must be 1-64 characters: letters, digits, ".", "_" or "-"')
  }
  if (!TIME_LIMIT_PATTERN.test(timeLimit)) {
    addError('timeLimit', 'Time limit must be in [D-]HH:MM:SS format')
  }

  const recipe = getRlRecipe(recipes, getString(formData, 'recipeId'))
  const model = recipe?.models.find((m) => m.id === getString(formData, 'modelId'))
  const environment = recipe?.environments.find(
    (e) => e.id === getString(formData, 'environmentId'),
  )
  if (!recipe) addError('recipeId', 'Select a training recipe')
  if (recipe && !model) addError('modelId', 'Select a model supported by the recipe')
  if (recipe && !environment) {
    addError('environmentId', 'Select an environment or dataset supported by the recipe')
  }

  const preset = recipe
    ? getHyperparameterPreset(recipe, getString(formData, 'presetId'))
    : undefined
  const isPresetMissing = !!recipe?.hyperparameterPresets?.length && !preset
  if (isPresetMissing) addError('presetId', 'Select a hyperparameter preset')

  const rawHyperparameters: Record<string, string> = {}
  const definitions = recipe ? getActiveHyperparameters(recipe, preset) : []
  definitions.forEach((definition: HyperparameterDefinition) => {
    rawHyperparameters[definition.key] = getString(
      formData,
      `${HYPERPARAMETER_FIELD_PREFIX}${definition.key}`,
    )
  })
  const { values: hyperparameters, errors: hyperparameterErrors } =
    recipe && !isPresetMissing
      ? parseHyperparameters(recipe, rawHyperparameters, preset)
      : { values: {}, errors: {} }
  Object.entries(hyperparameterErrors).forEach(([key, message]) => {
    addError(`${HYPERPARAMETER_FIELD_PREFIX}${key}`, message, rawHyperparameters[key])
  })

  const nodesResult =
    recipe && !isPresetMissing && Object.keys(hyperparameterErrors).length === 0
      ? resolveNodeCount(recipe, hyperparameters, getString(formData, 'nodes'))
      : null
  if (nodesResult && 'error' in nodesResult) addError('nodes', nodesResult.error)

  const monitoringDestination = recipe?.monitoringDestinations.find(
    (d) => d.id === getString(formData, 'monitoringDestinationId'),
  )
  if (recipe && !monitoringDestination) {
    addError('monitoringDestinationId', 'Select a monitoring destination supported by the recipe')
  }
  const monitoringValues: Record<string, HyperparameterValue | null> = {}
  monitoringDestination?.parameters.forEach((parameter: MonitoringParameter) => {
    const fieldName = `${MONITORING_FIELD_PREFIX}${parameter.key}`
    const raw = formData.get(fieldName)
    const result = parseHyperparameterValue(parameter, typeof raw === 'string' ? raw : null)
    if ('error' in result) {
      addError(fieldName, result.error, raw)
    } else {
      monitoringValues[parameter.key] = result.value
    }
  })

  if (
    errors.length > 0 ||
    !recipe ||
    !model ||
    !environment ||
    !monitoringDestination ||
    !nodesResult ||
    'error' in nodesResult
  ) {
    throw new ValidationError(errors)
  }

  return {
    system,
    account,
    workingDirectory,
    recipe,
    model,
    environment,
    hyperparameters,
    preset,
    monitoring: resolveMonitoring(monitoringDestination, monitoringValues),
    // On unless explicitly turned off
    runTracking: getString(formData, 'runTracking') !== 'false',
    jobOptions: {
      jobName,
      nodes: nodesResult.value,
      timeLimit,
      partition: partition || undefined,
      reservation: reservation || undefined,
    },
  }
}
