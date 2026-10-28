/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

// NeMo-RL recipes, one per blueprint published in alps-extended-images
// (Alps-Images/apps/nemo-rl/blueprints/index.json, generated and checked by its CI). The index is
// read at a pinned commit, which is also the version recorded with each run, and the job checks
// out the blueprint's example folder at the same commit.
//
// The index comes from outside this app and ends up in batch scripts, so it is checked again
// here: everything written into a script must match a strict pattern, text that is only shown
// must not contain control characters, and a blueprint that doesn't fit is left out whole.

// types
import type {
  HyperparameterDefinition,
  HyperparameterPreset,
  HyperparameterValue,
  MonitoringDestination,
  MonitoringParameter,
  TrainingRecipe,
  TrainingScriptContext,
} from '~/types/ai-training'
// helpers
import { TIME_LIMIT_PATTERN } from '~/modules/ai-training/helpers/rl-recipe-helper'
// recipes
import {
  NAME_PATTERN,
  NAME_PATTERN_MESSAGE,
  wandbEnvironmentParameters,
} from '~/modules/ai-training/recipes/monitoring-parameters'

export const NEMO_RL_BLUEPRINTS_PATH = 'Alps-Images/apps/nemo-rl/blueprints/index.json'
const EXAMPLE_PATH = 'Alps-Images/apps/nemo-rl/example'
const BLUEPRINTS_DIR = 'Alps-Images/apps/nemo-rl/blueprints'
const INDEX_SCHEMA_VERSION = 1

export const REPOSITORY_PATTERN = /^[A-Za-z0-9-]{1,39}\/[A-Za-z0-9._-]{1,100}$/
// A full commit id, so that the index and the checked-out example can't change
export const COMMIT_PATTERN = /^[0-9a-f]{40}$/
const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/
const VARIABLE_PATTERN = /^[A-Z][A-Z0-9_]{0,63}$/
const RECIPE_PATTERN = /^[a-z0-9][a-z0-9-]*(\/[a-z0-9][a-z0-9-]*)*$/
const IMAGE_PATTERN = /^[a-z0-9.-]+(:[0-9]+)?(\/[a-z0-9._-]+)+:[A-Za-z0-9._-]+$/
const MODEL_PATH_PATTERN = /^\/[A-Za-z0-9._/-]+$/
const SBATCH_PATTERN = /^--[a-z][a-z-]*(=[A-Za-z0-9_.:,-]+)?$/
const ENV_VALUE_PATTERN = /^[A-Za-z0-9._-]*$/
// Shown, or written into a script comment: one line, no control characters
// eslint-disable-next-line no-control-regex
const TEXT_PATTERN = /^[^\u0000-\u001f\u007f]{1,400}$/

export interface NemoRlBlueprintSource {
  // GitHub owner/name
  repository: string
  commit: string
}

interface BlueprintParameter {
  key: string
  label: string
  description?: string
  group: string
  type: 'int' | 'float'
  min: number
  max: number
  profiles?: string[]
}

type Factor = string | number

type BlueprintRule =
  | { kind: 'atMost'; value: string; limit: string; target: string; message: string }
  | { kind: 'divisible'; dividend: Factor[]; divisor: Factor[]; target: string; message: string }

interface BlueprintProfile {
  id: string
  name: string
  description: string
  timeLimit: string | null
  defaults: Record<string, number>
}

interface BlueprintMonitoring {
  id: string
  name: string
  description: string
  environment: Record<string, string>
  parameters: {
    variable: string
    label: string
    description?: string
    required: boolean
    default?: string
  }[]
}

export interface NemoRlBlueprint {
  id: string
  name: string
  description: string
  status: 'validated' | 'experimental'
  topology: { mode: 'sync' | 'async'; placement: 'split' | 'colocated' }
  engines: { training: string; generation: string }
  launch: { recipe: string; image: string }
  models: {
    id: string
    name: string
    architecture: string
    parameters?: string
    path: string
    description: string
  }[]
  datasets: { id: string; name: string; description: string }[]
  resources: { gpusPerNode: number; nodes: string[]; sbatch: string[] }
  profiles: BlueprintProfile[]
  parameters: BlueprintParameter[]
  rules: BlueprintRule[]
  monitoring: BlueprintMonitoring[]
  references: { profile: string; summary: string; url?: string }[]
}

// What the pages get from the server: plain data, turned into recipes where they are used
export interface NemoRlBlueprintCatalog {
  source: NemoRlBlueprintSource
  blueprints: NemoRlBlueprint[]
  // Set when the index could not be loaded; recipes from other frameworks still work
  error: string | null
}

// ----- Checking the index -----

type JsonObject = Record<string, unknown>

class InvalidBlueprint extends Error {}

const isObject = (value: unknown): value is JsonObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const fail = (message: string): never => {
  throw new InvalidBlueprint(message)
}

const object = (value: unknown, what: string): JsonObject =>
  isObject(value) ? value : fail(`${what} is not an object`)

const list = (value: unknown, what: string): unknown[] =>
  Array.isArray(value) ? value : fail(`${what} is not a list`)

const matching = (value: unknown, pattern: RegExp, what: string): string =>
  typeof value === 'string' && pattern.test(value) ? value : fail(`${what} is not valid`)

const optionalText = (value: unknown, what: string) =>
  value === undefined ? undefined : matching(value, TEXT_PATTERN, what)

const finiteNumber = (value: unknown, what: string): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fail(`${what} is not a number`)

const oneOf = <T extends string>(value: unknown, choices: readonly T[], what: string): T =>
  choices.includes(value as T) ? (value as T) : fail(`${what} is not one of ${choices.join(', ')}`)

const ids = (value: unknown, what: string) =>
  list(value, what).map((id) => matching(id, ID_PATTERN, what))

const checkParameter = (value: unknown): BlueprintParameter => {
  const parameter = object(value, 'parameter')
  const key = matching(parameter.key, VARIABLE_PATTERN, 'parameter key')
  const type = oneOf(parameter.type, ['int', 'float'] as const, `${key} type`)
  const min = finiteNumber(parameter.min, `${key} min`)
  const max = finiteNumber(parameter.max, `${key} max`)
  if (min > max) fail(`${key} has min above max`)
  return {
    key,
    label: matching(parameter.label, TEXT_PATTERN, `${key} label`),
    description: optionalText(parameter.description, `${key} description`),
    group: matching(parameter.group, TEXT_PATTERN, `${key} group`),
    type,
    min,
    max,
    profiles:
      parameter.profiles === undefined ? undefined : ids(parameter.profiles, `${key} profiles`),
  }
}

const checkFactors = (value: unknown, what: string): Factor[] =>
  list(value, what).map((factor) =>
    typeof factor === 'number'
      ? Number.isInteger(factor) && factor > 0
        ? factor
        : fail(`${what} has an invalid factor`)
      : matching(factor, VARIABLE_PATTERN, what),
  )

const checkRule = (value: unknown): BlueprintRule => {
  const rule = object(value, 'rule')
  const target = matching(rule.target, VARIABLE_PATTERN, 'rule target')
  const message = matching(rule.message, TEXT_PATTERN, 'rule message')
  if (rule.kind === 'atMost') {
    return {
      kind: 'atMost',
      value: matching(rule.value, VARIABLE_PATTERN, 'rule value'),
      limit: matching(rule.limit, VARIABLE_PATTERN, 'rule limit'),
      target,
      message,
    }
  }
  if (rule.kind === 'divisible') {
    return {
      kind: 'divisible',
      dividend: checkFactors(rule.dividend, 'rule dividend'),
      divisor: checkFactors(rule.divisor, 'rule divisor'),
      target,
      message,
    }
  }
  return fail('unknown rule kind')
}

const checkProfile = (value: unknown): BlueprintProfile => {
  const profile = object(value, 'profile')
  const id = matching(profile.id, ID_PATTERN, 'profile id')
  const defaults: Record<string, number> = {}
  Object.entries(object(profile.defaults, `${id} defaults`)).forEach(([key, number]) => {
    defaults[matching(key, VARIABLE_PATTERN, `${id} default key`)] = finiteNumber(
      number,
      `${id} default ${key}`,
    )
  })
  return {
    id,
    name: matching(profile.name, TEXT_PATTERN, `${id} name`),
    description: matching(profile.description, TEXT_PATTERN, `${id} description`),
    timeLimit:
      typeof profile.timeLimit === 'string' && TIME_LIMIT_PATTERN.test(profile.timeLimit)
        ? profile.timeLimit
        : null,
    defaults,
  }
}

const checkMonitoring = (value: unknown): BlueprintMonitoring => {
  const destination = object(value, 'monitoring destination')
  const id = matching(destination.id, ID_PATTERN, 'monitoring id')
  const environment: Record<string, string> = {}
  Object.entries(object(destination.environment, `${id} environment`)).forEach(([name, text]) => {
    environment[matching(name, VARIABLE_PATTERN, `${id} variable`)] = matching(
      text,
      ENV_VALUE_PATTERN,
      `${id} ${name}`,
    )
  })
  return {
    id,
    name: matching(destination.name, TEXT_PATTERN, `${id} name`),
    description: matching(destination.description, TEXT_PATTERN, `${id} description`),
    environment,
    parameters: list(destination.parameters, `${id} parameters`).map((item) => {
      const parameter = object(item, `${id} parameter`)
      const variable = matching(parameter.variable, VARIABLE_PATTERN, `${id} parameter`)
      if (typeof parameter.required !== 'boolean') fail(`${variable} required is not a boolean`)
      return {
        variable,
        label: matching(parameter.label, TEXT_PATTERN, `${variable} label`),
        description: optionalText(parameter.description, `${variable} description`),
        required: parameter.required as boolean,
        default:
          parameter.default === undefined
            ? undefined
            : matching(parameter.default, ENV_VALUE_PATTERN, `${variable} default`),
      }
    }),
  }
}

const checkBlueprint = (value: unknown): NemoRlBlueprint => {
  const blueprint = object(value, 'blueprint')
  const id = matching(blueprint.id, ID_PATTERN, 'blueprint id')
  const topology = object(blueprint.topology, 'topology')
  const engines = object(blueprint.engines, 'engines')
  const launch = object(blueprint.launch, 'launch')
  const resources = object(blueprint.resources, 'resources')
  const gpusPerNode = finiteNumber(resources.gpusPerNode, 'gpusPerNode')
  if (!Number.isInteger(gpusPerNode) || gpusPerNode < 1) fail('gpusPerNode is not valid')

  const result: NemoRlBlueprint = {
    id,
    name: matching(blueprint.name, TEXT_PATTERN, 'name'),
    description: matching(blueprint.description, TEXT_PATTERN, 'description'),
    status: oneOf(blueprint.status, ['validated', 'experimental'] as const, 'status'),
    topology: {
      mode: oneOf(topology.mode, ['sync', 'async'] as const, 'topology mode'),
      placement: oneOf(topology.placement, ['split', 'colocated'] as const, 'placement'),
    },
    engines: {
      training: matching(engines.training, ID_PATTERN, 'training engine'),
      generation: matching(engines.generation, ID_PATTERN, 'generation engine'),
    },
    launch: {
      recipe: matching(launch.recipe, RECIPE_PATTERN, 'launch recipe'),
      image: matching(launch.image, IMAGE_PATTERN, 'launch image'),
    },
    models: list(blueprint.models, 'models').map((item) => {
      const model = object(item, 'model')
      const modelId = matching(model.id, ID_PATTERN, 'model id')
      return {
        id: modelId,
        name: matching(model.name, TEXT_PATTERN, `${modelId} name`),
        architecture: matching(model.architecture, ID_PATTERN, `${modelId} architecture`),
        parameters: optionalText(model.parameters, `${modelId} parameters`),
        path: matching(model.path, MODEL_PATH_PATTERN, `${modelId} path`),
        description: matching(model.description, TEXT_PATTERN, `${modelId} description`),
      }
    }),
    datasets: list(blueprint.datasets, 'datasets').map((item) => {
      const dataset = object(item, 'dataset')
      const datasetId = matching(dataset.id, ID_PATTERN, 'dataset id')
      return {
        id: datasetId,
        name: matching(dataset.name, TEXT_PATTERN, `${datasetId} name`),
        description: matching(dataset.description, TEXT_PATTERN, `${datasetId} description`),
      }
    }),
    resources: {
      gpusPerNode,
      nodes: list(resources.nodes, 'nodes').map((key) =>
        matching(key, VARIABLE_PATTERN, 'node parameter'),
      ),
      sbatch: list(resources.sbatch, 'sbatch').map((option) =>
        matching(option, SBATCH_PATTERN, 'sbatch option'),
      ),
    },
    profiles: list(blueprint.profiles, 'profiles').map(checkProfile),
    parameters: list(blueprint.parameters, 'parameters').map(checkParameter),
    rules: list(blueprint.rules ?? [], 'rules').map(checkRule),
    monitoring: list(blueprint.monitoring, 'monitoring').map(checkMonitoring),
    references: list(blueprint.references ?? [], 'references').map((item) => {
      const reference = object(item, 'reference')
      return {
        profile: matching(reference.profile, ID_PATTERN, 'reference profile'),
        summary: matching(reference.summary, TEXT_PATTERN, 'reference summary'),
        url:
          typeof reference.url === 'string' && /^https:\/\/[^\s"'<>]+$/.test(reference.url)
            ? reference.url
            : undefined,
      }
    }),
  }

  // What the recipe relies on: something to choose, and every name used declared once
  const keys = result.parameters.map((parameter) => parameter.key)
  const profileIds = result.profiles.map((profile) => profile.id)
  if (!result.models.length || !result.datasets.length || !result.profiles.length) {
    fail('a blueprint needs models, datasets and profiles')
  }
  if (!result.monitoring.length) fail('a blueprint needs a monitoring destination')
  if (new Set(keys).size !== keys.length || new Set(profileIds).size !== profileIds.length) {
    fail('duplicate parameter or profile ids')
  }
  const declared = (key: string) => keys.includes(key)
  if (!result.resources.nodes.every(declared)) fail('node count uses an undeclared parameter')
  result.rules.forEach((rule) => {
    const used =
      rule.kind === 'atMost'
        ? [rule.value, rule.limit, rule.target]
        : [...rule.dividend, ...rule.divisor, rule.target]
    if (!used.every((factor) => typeof factor === 'number' || declared(factor))) {
      fail('a rule uses an undeclared parameter')
    }
  })
  result.parameters.forEach((parameter) => {
    const applies = parameter.profiles ?? profileIds
    if (!applies.every((profileId) => profileIds.includes(profileId))) {
      fail(`${parameter.key} names an unknown profile`)
    }
    applies.forEach((profileId) => {
      const profile = result.profiles.find((p) => p.id === profileId)!
      if (!(parameter.key in profile.defaults)) fail(`${profileId} has no ${parameter.key}`)
    })
  })
  return result
}

// The blueprints of an index.json; a blueprint that doesn't fit is left out, with the reason
export const parseBlueprintIndex = (
  data: unknown,
): { blueprints: NemoRlBlueprint[]; skipped: string[] } => {
  if (!isObject(data) || data.schemaVersion !== INDEX_SCHEMA_VERSION) {
    return { blueprints: [], skipped: ['unsupported index schema version'] }
  }
  const blueprints: NemoRlBlueprint[] = []
  const skipped: string[] = []
  ;(Array.isArray(data.blueprints) ? data.blueprints : []).forEach((value, index) => {
    try {
      const blueprint = checkBlueprint(value)
      if (blueprints.some((b) => b.id === blueprint.id)) fail('duplicate blueprint id')
      blueprints.push(blueprint)
    } catch (error) {
      if (!(error instanceof InvalidBlueprint)) throw error
      skipped.push(`blueprint ${index + 1}: ${error.message}`)
    }
  })
  return { blueprints, skipped }
}

// ----- Recipes -----

export const getBlueprintRecipeId = (blueprint: NemoRlBlueprint) => `nemo-rl-${blueprint.id}`

const product = (factors: Factor[], values: Record<string, HyperparameterValue>) =>
  factors.reduce<number>(
    (result, factor) => result * (typeof factor === 'number' ? factor : Number(values[factor])),
    1,
  )

// Rules over parameters that don't apply with the chosen preset are skipped
const validateRules = (rules: BlueprintRule[]) => (values: Record<string, HyperparameterValue>) => {
  const errors: Record<string, string> = {}
  const has = (factor: Factor) => typeof factor === 'number' || factor in values
  rules.forEach((rule) => {
    if (rule.kind === 'atMost') {
      if (!has(rule.value) || !has(rule.limit)) return
      if (Number(values[rule.value]) > Number(values[rule.limit])) {
        errors[rule.target] = rule.message
      }
      return
    }
    if (![...rule.dividend, ...rule.divisor].every(has)) return
    const divisor = product(rule.divisor, values)
    if (divisor === 0 || product(rule.dividend, values) % divisor !== 0) {
      errors[rule.target] = rule.message
    }
  })
  return errors
}

const toMonitoringDestination = (destination: BlueprintMonitoring): MonitoringDestination => {
  const group = destination.name
  const parameters: MonitoringParameter[] = destination.parameters.map((parameter) => ({
    key: parameter.variable,
    label: parameter.label,
    description: parameter.description,
    group,
    type: 'string',
    default: parameter.default ?? '',
    required: parameter.required,
    pattern: NAME_PATTERN,
    patternMessage: NAME_PATTERN_MESSAGE,
    target: { kind: 'env', name: parameter.variable },
  }))
  // W&B needs an API key, which blueprints leave to the launcher: it is read from a file on the
  // cluster when the job starts, with the other W&B settings the UI offers for every recipe
  if (destination.id === 'wandb') {
    const declared = new Set(destination.parameters.map((parameter) => parameter.variable))
    wandbEnvironmentParameters()
      .filter((parameter) => !('name' in parameter.target) || !declared.has(parameter.target.name))
      .forEach((parameter) => parameters.push({ ...parameter, group }))
  }
  return {
    id: destination.id,
    name: destination.name,
    description: destination.description,
    documentationUrl: destination.id === 'wandb' ? 'https://docs.wandb.ai/' : undefined,
    overrides: {},
    environment: destination.environment,
    parameters,
  }
}

const buildScriptBody =
  (source: NemoRlBlueprintSource, blueprint: NemoRlBlueprint) =>
  ({ model, hyperparameters, preset, jobName }: TrainingScriptContext) => {
    const exports = Object.entries(hyperparameters).map(
      ([key, value]) => `export ${key}="${value}"`,
    )
    return `RUN_NAME="${jobName}-\${SLURM_JOB_ID}"
BLUEPRINT_ROOT="\${JOB_WORKING_DIR}/\${RUN_NAME}/alps-extended-images"

# Blueprint ${blueprint.id}, pinned to a commit
git init --quiet "\${BLUEPRINT_ROOT}"
git -C "\${BLUEPRINT_ROOT}" remote add origin https://github.com/${source.repository}.git
git -C "\${BLUEPRINT_ROOT}" sparse-checkout set ${EXAMPLE_PATH}
git -C "\${BLUEPRINT_ROOT}" fetch --quiet --depth 1 origin ${source.commit}
git -C "\${BLUEPRINT_ROOT}" checkout --quiet FETCH_HEAD
export CHONK_EXAMPLES_DIR="\${BLUEPRINT_ROOT}/${EXAMPLE_PATH}"
# Checkpoints, logs and the converted model go next to the checkout, in the working directory
export CHONK_RUN_ROOT="\${JOB_WORKING_DIR}/\${RUN_NAME}"

# Container image and starting checkpoint
export NEMO_RL_IMAGE="${blueprint.launch.image}"
export HF_MODEL="${model.modelPath}"

# Profile values; the profile keeps its default for any value not exported here
${exports.join('\n')}

bash "\${CHONK_EXAMPLES_DIR}/train.sh" ${blueprint.launch.recipe} --profile ${preset?.id ?? blueprint.profiles[0].id}
`
  }

export const blueprintToRecipe = (
  source: NemoRlBlueprintSource,
  blueprint: NemoRlBlueprint,
): TrainingRecipe => {
  const [firstProfile] = blueprint.profiles
  const defaultOf = (key: string) =>
    blueprint.profiles.find((profile) => key in profile.defaults)?.defaults[key] ?? 0
  const parameterOf = (key: string) => blueprint.parameters.find((p) => p.key === key)!
  const sum = (pick: (key: string) => number) =>
    blueprint.resources.nodes.reduce((total, key) => total + pick(key), 0)

  const hyperparameters: HyperparameterDefinition[] = blueprint.parameters.map((parameter) => ({
    key: parameter.key,
    label: parameter.label,
    description: parameter.description,
    group: parameter.group,
    type: parameter.type,
    default: defaultOf(parameter.key),
    min: parameter.min,
    max: parameter.max,
    presets: parameter.profiles,
  }))
  const presets: HyperparameterPreset[] = blueprint.profiles.map((profile) => ({
    id: profile.id,
    name: profile.name,
    description: profile.description,
    defaults: profile.defaults,
  }))

  return {
    id: getBlueprintRecipeId(blueprint),
    name: blueprint.name,
    framework: 'NeMo-RL',
    algorithm: 'GRPO',
    description: blueprint.description,
    documentationUrl: `https://github.com/${source.repository}/tree/${source.commit}/${EXAMPLE_PATH}/${blueprint.launch.recipe}`,
    version: source.commit,
    // The blueprint's folder at the commit; runs of older commits are assumed to come from the
    // same repository
    getVersionUrl: (version) =>
      COMMIT_PATTERN.test(version)
        ? `https://github.com/${source.repository}/tree/${version}/${BLUEPRINTS_DIR}/${blueprint.id}`
        : undefined,
    nodes: {
      default: sum((key) => firstProfile.defaults[key] ?? parameterOf(key).min),
      min: sum((key) => parameterOf(key).min),
      max: sum((key) => parameterOf(key).max),
    },
    getNodeCount: (values) =>
      blueprint.resources.nodes.reduce((total, key) => total + Number(values[key]), 0),
    nodeCountDescription: `${blueprint.resources.nodes.map((key) => parameterOf(key).label).join(' + ')}, set in the hyperparameters`,
    gpusPerNode: blueprint.resources.gpusPerNode,
    defaultTimeLimit: firstProfile.timeLimit ?? undefined,
    sbatchOptions: blueprint.resources.sbatch,
    validateHyperparameters: validateRules(blueprint.rules),
    models: blueprint.models.map((model) => ({
      id: model.id,
      name: model.name,
      modelPath: model.path,
      parameters: model.parameters ?? model.architecture,
      description: model.description,
    })),
    environments: blueprint.datasets.map((dataset) => ({
      id: dataset.id,
      name: dataset.name,
      kind: 'dataset',
      description: dataset.description,
    })),
    hyperparameters,
    hyperparameterPresets: presets,
    monitoringDestinations: blueprint.monitoring.map(toMonitoringDestination),
    buildScriptBody: buildScriptBody(source, blueprint),
  }
}

export const getBlueprintRecipes = (catalog: NemoRlBlueprintCatalog | null): TrainingRecipe[] =>
  catalog?.blueprints.map((blueprint) => blueprintToRecipe(catalog.source, blueprint)) ?? []
