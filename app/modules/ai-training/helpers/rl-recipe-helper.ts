/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { WANDB_RUN_ID, getWandbRunUrl } from '~/modules/ai-training/recipes/monitoring-parameters'
// types
import type {
  HyperparameterDefinition,
  HyperparameterPreset,
  HyperparameterValue,
  MonitoringDestination,
  MonitoringParameter,
  ResolvedMonitoring,
  TrainingEnvironment,
  TrainingJobOptions,
  TrainingModel,
  TrainingRecipe,
} from '~/types/ai-training'

// The job name ends up inside the generated script (run directory name), so it is restricted
// to characters that are safe unquoted in a shell and in a path.
export const JOB_NAME_PATTERN = /^[A-Za-z0-9._-]{1,64}$/
export const TIME_LIMIT_PATTERN = /^(\d+-)?\d{1,2}:\d{2}:\d{2}$/
export const DEFAULT_TIME_LIMIT = '04:00:00'

// Every launched run records its settings (<job id>-run.json, at job start) and outcome
// (<job id>-result.json, at job exit), all directly in this directory, from where they are
// collected into run records by .github/rl-runs-collector/collect_rl_runs.py in
// eth-cscs/alps-extended-images. A single fixed location for now; jobs don't create it, so it
// must exist and be writable by everyone launching runs.
export const RUN_TRACKER_DIR = '/capstor/scratch/cscs/palmee/rl-runs-tracker'

// Version of the tracker file format. The collector only accepts the version it knows, so
// change both together.
export const RUN_RECORD_SCHEMA_VERSION = 1

export const HYPERPARAMETER_FIELD_PREFIX = 'hp.'
export const MONITORING_FIELD_PREFIX = 'mon.'

// Free-text values are written inside double quotes, where these would still be interpreted
const SHELL_UNSAFE_PATTERN = /["$`\\\n\r]/
// Absolute or home-relative paths only, made of characters that need no escaping
const PATH_PATTERN = /^(~\/|\/)[A-Za-z0-9._/+-]+$/

export const getHyperparameterPreset = (recipe: TrainingRecipe, presetId: string | null) => {
  return recipe.hyperparameterPresets?.find(
    (preset: HyperparameterPreset) => preset.id === presetId,
  )
}

// The hyperparameters that apply with a preset (all those without a preset restriction when
// no preset is given)
export const getActiveHyperparameters = (
  recipe: TrainingRecipe,
  preset?: HyperparameterPreset,
): HyperparameterDefinition[] => {
  return recipe.hyperparameters.filter(
    (definition: HyperparameterDefinition) =>
      !definition.presets || (!!preset && definition.presets.includes(preset.id)),
  )
}

// Defaults in increasing precedence: the recipe's, the model's, then the preset's
export const getDefaultHyperparameters = (
  recipe: TrainingRecipe,
  model?: TrainingModel,
  preset?: HyperparameterPreset,
): Record<string, HyperparameterValue> => {
  const defaults: Record<string, HyperparameterValue> = {}
  getActiveHyperparameters(recipe, preset).forEach((definition: HyperparameterDefinition) => {
    defaults[definition.key] =
      preset?.defaults[definition.key] ??
      model?.hyperparameterDefaults?.[definition.key] ??
      definition.default
  })
  return defaults
}

// Floats keep a decimal point so that config parsers don't read e.g. a temperature of 1.0 as int
export const formatHyperparameterValue = (
  value: HyperparameterValue,
  type?: HyperparameterDefinition['type'],
): string => {
  if (type === 'float' && typeof value === 'number') {
    if (Number.isInteger(value)) return value.toFixed(1)
    // Exponent notation with a decimal point in the mantissa (5.0e-7, not 5e-7), which
    // YAML 1.1 parsers require to read the value as a float
    const formatted = String(value)
    const [mantissa, exponent] = formatted.split('e')
    if (exponent !== undefined && !mantissa.includes('.')) return `${mantissa}.0e${exponent}`
    return formatted
  }
  return String(value)
}

// Parses a raw form value against its definition. Returns an error message when the value is
// not acceptable - only values that pass here are ever written into a batch script. An empty
// optional value parses to null.
export const parseHyperparameterValue = (
  definition: HyperparameterDefinition,
  rawValue: string | null | undefined,
): { value: HyperparameterValue | null } | { error: string } => {
  const raw = (rawValue ?? '').trim()
  if (raw === '') {
    return definition.required === false
      ? { value: null }
      : { error: `${definition.label} is required` }
  }
  switch (definition.type) {
    case 'bool':
      if (raw !== 'true' && raw !== 'false') {
        return { error: `${definition.label} must be true or false` }
      }
      return { value: raw === 'true' }
    case 'choice':
      if (!definition.choices?.includes(raw)) {
        return { error: `${definition.label} must be one of: ${definition.choices?.join(', ')}` }
      }
      return { value: raw }
    case 'string':
      if (
        SHELL_UNSAFE_PATTERN.test(raw) ||
        !definition.pattern ||
        !new RegExp(`^(?:${definition.pattern})$`).test(raw)
      ) {
        return { error: definition.patternMessage ?? `${definition.label} is not valid` }
      }
      return { value: raw }
    case 'path':
      if (!PATH_PATTERN.test(raw)) {
        return {
          error: `${definition.label} must be an absolute path or start with ~/, using only letters, digits and . _ / + -`,
        }
      }
      return { value: raw }
    case 'int':
    case 'float': {
      const isValidNumber =
        definition.type === 'int'
          ? /^-?\d+$/.test(raw)
          : /^-?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(raw)
      if (!isValidNumber) {
        return {
          error: `${definition.label} must be ${definition.type === 'int' ? 'an integer' : 'a number'}`,
        }
      }
      const value = Number(raw)
      if (definition.min !== undefined && value < definition.min) {
        return { error: `${definition.label} must be at least ${definition.min}` }
      }
      if (definition.max !== undefined && value > definition.max) {
        return { error: `${definition.label} must be at most ${definition.max}` }
      }
      return { value }
    }
  }
}

// Paths starting with ~/ are written relative to $HOME, since ~ doesn't expand inside quotes
const formatScriptPath = (path: string) => {
  return path.startsWith('~/') ? `\${HOME}/${path.slice(2)}` : path
}

export const getDefaultMonitoringValues = (destination: MonitoringDestination) => {
  const values: Record<string, string> = {}
  destination.parameters.forEach((parameter: MonitoringParameter) => {
    values[parameter.key] = formatHyperparameterValue(parameter.default, parameter.type)
  })
  return values
}

// Maps validated monitoring parameter values to where they go in the script. Empty optional
// values are left out, so destination-level overrides (e.g. a default run name) still apply.
export const resolveMonitoring = (
  destination: MonitoringDestination,
  values: Record<string, HyperparameterValue | null>,
): ResolvedMonitoring => {
  const resolved: ResolvedMonitoring = {
    destination,
    overrides: { ...destination.overrides },
    environment: { ...destination.environment },
    secretFiles: {},
    runHistory: {},
  }
  destination.parameters.forEach((parameter: MonitoringParameter) => {
    const value = values[parameter.key]
    if (value === null || value === undefined) return
    const formattedValue = formatHyperparameterValue(value, parameter.type)
    switch (parameter.target.kind) {
      case 'override':
        resolved.overrides[parameter.key] = formattedValue
        break
      case 'env':
        resolved.environment[parameter.target.name] = formattedValue
        break
      case 'secretFile':
        resolved.secretFiles[parameter.target.name] = formatScriptPath(formattedValue)
        break
      case 'runHistory':
        resolved.runHistory[parameter.key] = formattedValue
        break
    }
  })
  return resolved
}

const buildMonitoringSetup = (monitoring: ResolvedMonitoring): string[] => {
  const lines: string[] = []
  Object.entries(monitoring.environment).forEach(([name, value]) => {
    lines.push(`export ${name}="${value}"`)
  })
  if (getWandbRunUrl(monitoring)) lines.push(`export WANDB_RUN_ID="${WANDB_RUN_ID}"`)
  Object.entries(monitoring.secretFiles).forEach(([name, path]) => {
    lines.push(
      `if [ ! -r "${path}" ]; then echo "${name} file ${path} is not readable" >&2; exit 1; fi`,
      `export ${name}="$(cat "${path}")"`,
    )
  })
  return lines.length > 0 ? [`# Monitoring: ${monitoring.destination.name}`, ...lines, ''] : []
}

// Formats framework overrides as quoted `key=value` shell words. Values are either catalog
// constants or validated hyperparameters; double quotes keep shell variables like ${RUN_DIR}
// expanding while protecting against word splitting.
export const formatOverrides = (overrides: Record<string, HyperparameterValue>): string[] => {
  return Object.entries(overrides).map(
    ([key, value]) => `"${key}=${formatHyperparameterValue(value)}"`,
  )
}

// Inside an unquoted heredoc, only \, $ and ` are interpreted
const escapeForHeredoc = (text: string) => text.replace(/[\\$`]/g, (c: string) => `\\${c}`)

// Monitoring values recorded with a run, so that cloning it keeps them: all but secrets, paths
// (which can point into a home directory) and the W&B run name, which names that one run
const NOT_RECORDED_MONITORING_VARIABLES = ['WANDB_NAME']

const getMonitoringValue = (monitoring: ResolvedMonitoring, parameter: MonitoringParameter) => {
  switch (parameter.target.kind) {
    case 'env':
      return NOT_RECORDED_MONITORING_VARIABLES.includes(parameter.target.name)
        ? undefined
        : monitoring.environment[parameter.target.name]
    case 'override':
      return monitoring.overrides[parameter.key]
    case 'runHistory':
      return monitoring.runHistory[parameter.key]
    case 'secretFile':
      return undefined
  }
}

export const getRecordedMonitoringValues = (monitoring: ResolvedMonitoring) => {
  const values: Record<string, string> = {}
  monitoring.destination.parameters
    .filter((parameter: MonitoringParameter) => parameter.type !== 'path')
    .forEach((parameter: MonitoringParameter) => {
      const value = getMonitoringValue(monitoring, parameter)
      if (value !== undefined) values[parameter.key] = value
    })
  return values
}

// Settings known when the script is generated, limited to what may be published: catalog ids,
// numeric and short hyperparameter values, the monitoring destination and its settings (such as
// the W&B project and entity) and the job size. Nothing else that identifies a person (job
// name, paths, reservation), and no path hyperparameters, which can point into a home
// directory. The collector applies the same allowlist again, since anyone can write files into
// the tracker directory.
const buildRunRecord = ({
  recipe,
  model,
  environment,
  hyperparameters,
  preset,
  monitoring,
  jobOptions,
}: BuildTrainingScriptParams) => {
  const publishedHyperparameters: Record<string, HyperparameterValue> = {}
  getActiveHyperparameters(recipe, preset)
    .filter((definition: HyperparameterDefinition) => definition.type !== 'path')
    .forEach((definition: HyperparameterDefinition) => {
      if (definition.key in hyperparameters) {
        publishedHyperparameters[definition.key] = hyperparameters[definition.key]
      }
    })
  const monitoringUrl = getWandbRunUrl(monitoring)
  return {
    recipe: { id: recipe.id, version: recipe.version ?? null },
    model: { id: model.id },
    environment: { id: environment.id },
    preset: preset ? { id: preset.id } : null,
    hyperparameters: publishedHyperparameters,
    monitoring: {
      destination: monitoring.destination.id,
      settings: getRecordedMonitoringValues(monitoring),
      ...(monitoringUrl ? { url: monitoringUrl } : {}),
    },
    job: {
      nodes: jobOptions.nodes,
      gpusPerNode: recipe.gpusPerNode,
      timeLimit: jobOptions.timeLimit,
    },
  }
}

// Writes <job id>-run.json now and <job id>-result.json when the script exits, including on
// failure, timeout or cancellation (Slurm sends SIGTERM first). Tracking never fails the
// training: if the directory can't be written, the job only logs a warning. Each file is written
// under a hidden temporary name and then renamed, so the collector, which deletes the files it
// has processed, never reads a partly written one.
const buildRunTracking = (params: BuildTrainingScriptParams): string[] => {
  // The W&B run id in the link is the only shell syntax in the record and must expand; all
  // other values are validated not to contain any
  const runRecord = escapeForHeredoc(JSON.stringify(buildRunRecord(params), null, 2))
    .replace(escapeForHeredoc(WANDB_RUN_ID), WANDB_RUN_ID)
    .split('\n')
    .map((line: string, index: number) => (index === 0 ? line : `  ${line}`))
    .join('\n')
  return [
    '# Run tracking',
    `RUN_TRACKER_DIR="${RUN_TRACKER_DIR}"`,
    'RUN_STARTED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"',
    'RUN_SIGNAL=""',
    'if ! (umask 0022 && cat > "${RUN_TRACKER_DIR}/.${SLURM_JOB_ID}-run.json.tmp" <<RUN_JSON && mv -f "${RUN_TRACKER_DIR}/.${SLURM_JOB_ID}-run.json.tmp" "${RUN_TRACKER_DIR}/${SLURM_JOB_ID}-run.json"',
    '{',
    `  "schemaVersion": ${RUN_RECORD_SCHEMA_VERSION},`,
    '  "jobId": "${SLURM_JOB_ID}",',
    '  "cluster": "${SLURM_CLUSTER_NAME:-unknown}",',
    '  "startedAt": "${RUN_STARTED_AT}",',
    `  "launch": ${runRecord}`,
    '}',
    'RUN_JSON',
    '); then',
    '  echo "Run tracking disabled: cannot write ${RUN_TRACKER_DIR}" >&2',
    '  RUN_TRACKER_DIR=""',
    'fi',
    'write_run_result() {',
    '  local exit_code=$?',
    '  [ -n "${RUN_TRACKER_DIR}" ] || return 0',
    '  local status=failed',
    '  if [ -n "${RUN_SIGNAL}" ]; then status=terminated; elif [ "${exit_code}" -eq 0 ]; then status=completed; fi',
    '  (umask 0022 && cat > "${RUN_TRACKER_DIR}/.${SLURM_JOB_ID}-result.json.tmp" <<RESULT_JSON && mv -f "${RUN_TRACKER_DIR}/.${SLURM_JOB_ID}-result.json.tmp" "${RUN_TRACKER_DIR}/${SLURM_JOB_ID}-result.json"',
    '{',
    `  "schemaVersion": ${RUN_RECORD_SCHEMA_VERSION},`,
    '  "jobId": "${SLURM_JOB_ID}",',
    '  "cluster": "${SLURM_CLUSTER_NAME:-unknown}",',
    `  "recipeId": "${params.recipe.id}",`,
    '  "status": "${status}",',
    '  "exitCode": ${exit_code},',
    '  "signal": "${RUN_SIGNAL}",',
    '  "startedAt": "${RUN_STARTED_AT}",',
    '  "endedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",',
    '  "elapsedSeconds": ${SECONDS},',
    '  "metrics": null',
    '}',
    'RESULT_JSON',
    '  ) || echo "Run tracking: cannot write ${RUN_TRACKER_DIR}/${SLURM_JOB_ID}-result.json" >&2',
    '}',
    'trap write_run_result EXIT',
    "trap 'RUN_SIGNAL=TERM; exit 143' TERM",
    "trap 'RUN_SIGNAL=INT; exit 130' INT",
    '',
  ]
}

// Jobs submitted through FirecREST may start without the login environment; USER and HOME are
// restored from the account database if missing, since recipes and blueprints rely on them
const LOGIN_ENVIRONMENT = [
  '# Login environment',
  'export USER="${USER:-$(id -un)}"',
  'export HOME="${HOME:-$(getent passwd "${USER}" | cut -d: -f6)}"',
  '',
]

// The job starts in the working directory chosen at launch, but through FirecREST
// SLURM_SUBMIT_DIR is the user's home, so recipes use JOB_WORKING_DIR instead
const WORKING_DIRECTORY = ['JOB_WORKING_DIR="$(pwd)"', '']

interface BuildTrainingScriptParams {
  recipe: TrainingRecipe
  model: TrainingModel
  environment: TrainingEnvironment
  hyperparameters: Record<string, HyperparameterValue>
  preset?: HyperparameterPreset
  monitoring: ResolvedMonitoring
  jobOptions: TrainingJobOptions
  // Records the run's parameters and result for the shared run history
  runTracking: boolean
}

export const buildTrainingScript = (params: BuildTrainingScriptParams): string => {
  const {
    recipe,
    model,
    environment,
    hyperparameters,
    preset,
    monitoring,
    jobOptions,
    runTracking,
  } = params
  const header = [
    '#!/bin/bash',
    `#SBATCH --job-name=${jobOptions.jobName}`,
    `#SBATCH --nodes=${jobOptions.nodes}`,
    '#SBATCH --ntasks-per-node=1',
    `#SBATCH --gpus-per-node=${recipe.gpusPerNode}`,
    `#SBATCH --time=${jobOptions.timeLimit}`,
    ...(recipe.sbatchOptions ?? []).map((option: string) => `#SBATCH ${option}`),
    '',
    `# Generated by the AI Training page - recipe: ${recipe.name}, model: ${model.name}, ${environment.kind}: ${environment.name}${preset ? `, preset: ${preset.name}` : ''}`,
    'set -euo pipefail',
    '',
    ...LOGIN_ENVIRONMENT,
    ...WORKING_DIRECTORY,
    ...(runTracking ? buildRunTracking(params) : []),
    ...buildMonitoringSetup(monitoring),
  ].join('\n')
  const formattedHyperparameters: Record<string, string> = {}
  getActiveHyperparameters(recipe, preset).forEach((definition: HyperparameterDefinition) => {
    if (definition.key in hyperparameters) {
      formattedHyperparameters[definition.key] = formatHyperparameterValue(
        hyperparameters[definition.key],
        definition.type,
      )
    }
  })
  const body = recipe.buildScriptBody({
    recipe,
    model,
    environment,
    hyperparameters: formattedHyperparameters,
    preset,
    monitoring,
    jobName: jobOptions.jobName,
    nodes: jobOptions.nodes,
  })
  return `${header}\n${body}`
}

export const isNodeCountConfigurable = (recipe: TrainingRecipe) => {
  return !recipe.getNodeCount && recipe.nodes.min < recipe.nodes.max
}

// Parses the hyperparameters that apply with a preset, including the checks between them. Empty
// optional values are left out of `values`.
export const parseHyperparameters = (
  recipe: TrainingRecipe,
  rawValues: Record<string, string | null | undefined>,
  preset?: HyperparameterPreset,
) => {
  const values: Record<string, HyperparameterValue> = {}
  const errors: Record<string, string> = {}
  getActiveHyperparameters(recipe, preset).forEach((definition: HyperparameterDefinition) => {
    const result = parseHyperparameterValue(definition, rawValues[definition.key])
    if ('error' in result) {
      errors[definition.key] = result.error
    } else if (result.value !== null) {
      values[definition.key] = result.value
    }
  })
  if (Object.keys(errors).length === 0 && recipe.validateHyperparameters) {
    Object.assign(errors, recipe.validateHyperparameters(values))
  }
  return { values, errors }
}

// Node count for a launch: derived from the hyperparameters when the recipe defines it that
// way, otherwise the value chosen at launch
export const resolveNodeCount = (
  recipe: TrainingRecipe,
  hyperparameters: Record<string, HyperparameterValue>,
  rawValue: string | null | undefined,
): { value: number } | { error: string } => {
  return recipe.getNodeCount
    ? { value: recipe.getNodeCount(hyperparameters) }
    : parseNodeCount(recipe, rawValue)
}

export const parseNodeCount = (
  recipe: TrainingRecipe,
  rawValue: string | null | undefined,
): { value: number } | { error: string } => {
  const raw = (rawValue ?? '').trim()
  const value = Number(raw)
  if (!/^\d+$/.test(raw) || value < recipe.nodes.min || value > recipe.nodes.max) {
    return {
      error:
        recipe.nodes.min === recipe.nodes.max
          ? `${recipe.name} runs on exactly ${recipe.nodes.min} node(s)`
          : `Nodes must be between ${recipe.nodes.min} and ${recipe.nodes.max}`,
    }
  }
  return { value }
}

export const getDefaultJobName = (recipe: TrainingRecipe, model: TrainingModel) => {
  return `${recipe.id}-${model.id}`.replace(/[^A-Za-z0-9._-]/g, '-').slice(0, 64)
}
