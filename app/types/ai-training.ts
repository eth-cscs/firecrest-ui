/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

// Values are interpolated into a generated batch script, so free text is only allowed through
// the 'string' and 'path' types, which must match a pattern and never contain shell
// metacharacters (see rl-recipe-helper.ts).
export type HyperparameterType = 'int' | 'float' | 'bool' | 'choice' | 'string' | 'path'

export type HyperparameterValue = number | boolean | string

export interface HyperparameterDefinition {
  // Recipe-specific override key, e.g. a dotted config path like 'grpo.max_num_steps'
  key: string
  label: string
  description?: string
  group: string
  type: HyperparameterType
  default: HyperparameterValue
  min?: number
  max?: number
  step?: number
  // Allowed values for type 'choice'
  choices?: string[]
  // Regular expression (source) values of type 'string' must fully match
  pattern?: string
  patternMessage?: string
  placeholder?: string
  // Parameters are required unless set to false; empty optional values are left out
  required?: boolean
  // Preset ids the parameter applies to; applies to all presets when not set
  presets?: string[]
}

// A named set of hyperparameter defaults (e.g. an optimizer profile) picked before editing
export interface HyperparameterPreset {
  id: string
  name: string
  description?: string
  // Takes precedence over the recipe's and the model's defaults
  defaults: Record<string, HyperparameterValue>
}

// Where a monitoring parameter ends up in the generated script:
// - override: a framework config override, using the parameter key
// - env: an exported environment variable
// - secretFile: a file on the cluster whose content is exported as an environment variable
//   when the job starts, so secrets never go through the UI or into the script
// - runHistory: not passed to the job; decides what the run record publishes
export type MonitoringParameterTarget =
  | { kind: 'override' }
  | { kind: 'env'; name: string }
  | { kind: 'secretFile'; name: string }
  | { kind: 'runHistory' }

export interface MonitoringParameter extends HyperparameterDefinition {
  target: MonitoringParameterTarget
}

export interface MonitoringDestination {
  id: string
  name: string
  description?: string
  documentationUrl?: string
  // Fixed framework overrides that enable the destination
  overrides: Record<string, string>
  // Fixed environment variables that enable the destination
  environment?: Record<string, string>
  parameters: MonitoringParameter[]
}

export interface ResolvedMonitoring {
  destination: MonitoringDestination
  overrides: Record<string, string>
  environment: Record<string, string>
  secretFiles: Record<string, string>
  runHistory: Record<string, string>
}

export interface TrainingModel {
  id: string
  name: string
  // Model identifier as understood by the training framework (e.g. a Hugging Face repo id)
  modelPath: string
  parameters: string
  description?: string
  // Per-model defaults that take precedence over the recipe's hyperparameter defaults
  hyperparameterDefaults?: Record<string, HyperparameterValue>
  // Fixed framework overrides, not exposed to the user
  overrides?: Record<string, string>
}

export interface TrainingEnvironment {
  id: string
  name: string
  kind: 'environment' | 'dataset'
  description?: string
  // Fixed framework overrides, not exposed to the user
  overrides?: Record<string, string>
}

export interface TrainingScriptContext {
  recipe: TrainingRecipe
  model: TrainingModel
  environment: TrainingEnvironment
  hyperparameters: Record<string, HyperparameterValue>
  preset?: HyperparameterPreset
  monitoring: ResolvedMonitoring
  jobName: string
  nodes: number
}

export interface TrainingRecipe {
  id: string
  name: string
  framework: string
  algorithm: string
  description: string
  documentationUrl?: string
  // Pinned version of the training code (release tag or commit), recorded with each run
  version?: string
  // Where the job's TensorBoard event files are, in shell syntax, for the metrics of the run
  // history
  getMetricsDirectory?: (jobName: string) => string
  // Where the training code of a version (the recipe's or a published run's) can be seen
  getVersionUrl?: (version: string) => string | undefined
  // Node count range; when min < max, the count is chosen at launch
  nodes: { default: number; min: number; max: number }
  // Derives the node count from hyperparameters instead (e.g. training + generation nodes);
  // the count is then shown read-only at launch and `nodes` is not used
  getNodeCount?: (hyperparameters: Record<string, HyperparameterValue>) => number
  nodeCountDescription?: string
  defaultTimeLimit?: string
  // Additional `#SBATCH` options, e.g. '--exclusive'
  sbatchOptions?: string[]
  // Checks between hyperparameters, keyed by hyperparameter key
  validateHyperparameters?: (
    hyperparameters: Record<string, HyperparameterValue>,
  ) => Record<string, string>
  gpusPerNode: number
  models: TrainingModel[]
  environments: TrainingEnvironment[]
  hyperparameters: HyperparameterDefinition[]
  // When set, a preset is chosen first and fills in the hyperparameter defaults
  hyperparameterPresets?: HyperparameterPreset[]
  // The first destination is the default selection
  monitoringDestinations: MonitoringDestination[]
  // Returns the body of the batch script (everything after the #SBATCH header)
  buildScriptBody: (context: TrainingScriptContext) => string
}

export interface TrainingJobOptions {
  jobName: string
  nodes: number
  timeLimit: string
  partition?: string
  reservation?: string
}

// Published run history: one entry of a recipe's index.json on the rl-runs branch of the runs
// repository, as written by the run collector
export type RlRunStatus =
  | 'completed'
  | 'failed'
  | 'terminated'
  | 'preempted'
  | 'running'
  | 'unknown'

export interface RlRunSummary {
  recipeId: string
  // <cluster>-<job id>
  runId: string
  cluster: string
  // Slurm job id on the cluster
  jobId: string
  status: RlRunStatus
  // Days only (YYYY-MM-DD)
  startedOn: string | null
  endedOn: string | null
  elapsedSeconds: number | null
  recipeVersion: string | null
  model: string | null
  environment: string | null
  preset: string | null
  hyperparameters: Record<string, HyperparameterValue>
  monitoring: string | null
  // Link to the run in the monitoring destination, published only when chosen at launch
  monitoringUrl: string | null
  // Monitoring values chosen at launch, by parameter key (no secrets, paths or run name)
  monitoringSettings: Record<string, string>
  nodes: number | null
  gpusPerNode: number | null
  timeLimit: string | null
  partition: string | null
  // Scheduler account the job was charged to
  account: string | null
  // How often the run reports its metrics while running; null when it doesn't (older runs)
  metricsIntervalSeconds: number | null
  metrics: Record<string, number> | null
}

// The launch form's selections and values taken from a published run
export interface RlLaunchPrefill {
  run: RlRunSummary
  recipeId: string
  modelId: string | null
  environmentId: string | null
  presetId: string | null
  monitoringDestinationId: string | null
  // Raw form values of the destination's parameters, or null to start from its defaults
  monitoringValues: Record<string, string> | null
  // Raw form values of the active hyperparameters, and those that differ from the defaults
  hyperparameterValues: Record<string, string>
  editedKeys: string[]
  // Only for recipes whose node count is chosen at launch
  nodes: string | null
  timeLimit: string | null
  // Launch options, applied in the form only where they are still offered to the user
  system: string
  account: string | null
  partition: string | null
  // What could not be taken over as recorded
  notes: string[]
}
