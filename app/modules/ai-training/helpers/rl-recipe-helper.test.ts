/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { ValidationError } from 'yup'
import {
  buildTrainingScript,
  getActiveHyperparameters,
  getDefaultHyperparameters,
  getDefaultMonitoringValues,
  getHyperparameterPreset,
  RUN_TRACKER_DIR,
  isNodeCountConfigurable,
  parseHyperparameterValue,
  parseHyperparameters,
  resolveMonitoring,
  resolveNodeCount,
} from '~/modules/ai-training/helpers/rl-recipe-helper'
import { getRlRecipe } from '~/modules/ai-training/recipes/rl-recipes'
import {
  NEMO_RL_VLLM_RECIPE_ID,
  TEST_RECIPES as RL_RECIPES,
  TEST_SOURCE,
} from '~/modules/ai-training/recipes/__fixtures__/test-recipes'
import { TENSORBOARD_METRICS_READER } from '~/modules/ai-training/helpers/rl-metrics-reader'
import { validateRlTrainingLaunch } from '~/validations/aiTrainingValidation'
import type {
  HyperparameterDefinition,
  HyperparameterPreset,
  TrainingRecipe,
} from '~/types/ai-training'

const apertus = getRlRecipe(RL_RECIPES, NEMO_RL_VLLM_RECIPE_ID)!
const adamw = getHyperparameterPreset(apertus, 'adamw')!
const muon = getHyperparameterPreset(apertus, 'muon')!
const apertusModel = apertus.models[0]
const getDestination = (r: TrainingRecipe, id: string) =>
  r.monitoringDestinations.find((d) => d.id === id)!

const intDefinition: HyperparameterDefinition = {
  key: 'steps',
  label: 'Steps',
  group: 'Training',
  type: 'int',
  default: 10,
  min: 1,
  max: 100,
}

const buildApertusScript = (
  preset: HyperparameterPreset,
  hyperparameterOverrides: Record<string, number> = {},
  destinationId = 'tensorboard',
  monitoringValues = {},
  runTracking = true,
) =>
  buildTrainingScript({
    recipe: apertus,
    model: apertusModel,
    environment: apertus.environments[0],
    hyperparameters: {
      ...getDefaultHyperparameters(apertus, apertusModel, preset),
      ...hyperparameterOverrides,
    },
    preset,
    monitoring: resolveMonitoring(getDestination(apertus, destinationId), monitoringValues),
    jobOptions: { jobName: 'my-run', timeLimit: '07:00:00', nodes: 12 },
    runTracking,
  })

const buildFormData = (overrides: Record<string, string> = {}) => {
  const formData = new FormData()
  const values: Record<string, string> = {
    recipeId: apertus.id,
    modelId: apertusModel.id,
    environmentId: 'gsm8k',
    presetId: 'adamw',
    monitoringDestinationId: 'wandb',
    system: 'test-system',
    account: 'test-account',
    workingDirectory: '/scratch/user',
    jobName: 'my-run',
    timeLimit: '07:00:00',
  }
  Object.entries(getDefaultHyperparameters(apertus, apertusModel, adamw)).forEach(
    ([key, value]) => {
      values[`hp.${key}`] = String(value)
    },
  )
  Object.entries(getDefaultMonitoringValues(getDestination(apertus, 'wandb'))).forEach(
    ([key, value]) => {
      values[`mon.${key}`] = value
    },
  )
  Object.entries({ ...values, ...overrides }).forEach(([key, value]) => formData.set(key, value))
  return formData
}

describe('parseHyperparameterValue', () => {
  it('accepts valid integers within bounds', () => {
    expect(parseHyperparameterValue(intDefinition, '42')).toEqual({ value: 42 })
  })

  it('rejects non-integers, out of range values and shell content', () => {
    expect(parseHyperparameterValue(intDefinition, '4.2')).toHaveProperty('error')
    expect(parseHyperparameterValue(intDefinition, '0')).toHaveProperty('error')
    expect(parseHyperparameterValue(intDefinition, '101')).toHaveProperty('error')
    expect(parseHyperparameterValue(intDefinition, '1; rm -rf ~')).toHaveProperty('error')
    expect(parseHyperparameterValue(intDefinition, '')).toHaveProperty('error')
  })

  it('accepts floats in scientific notation', () => {
    const floatDefinition = { ...intDefinition, type: 'float' as const, min: 0, max: 1 }
    expect(parseHyperparameterValue(floatDefinition, '5e-6')).toEqual({ value: 5e-6 })
    expect(parseHyperparameterValue(floatDefinition, '$(id)')).toHaveProperty('error')
  })

  it('only accepts strings matching the pattern and without shell metacharacters', () => {
    const stringDefinition = {
      ...intDefinition,
      type: 'string' as const,
      default: '',
      pattern: '[a-z-]+',
    }
    expect(parseHyperparameterValue(stringDefinition, 'my-project')).toEqual({
      value: 'my-project',
    })
    expect(parseHyperparameterValue(stringDefinition, 'My Project')).toHaveProperty('error')
    expect(parseHyperparameterValue(stringDefinition, 'a$(id)')).toHaveProperty('error')
    // A permissive pattern does not let shell metacharacters through
    const anyDefinition = { ...stringDefinition, pattern: '.*' }
    expect(parseHyperparameterValue(anyDefinition, 'a"; id; "')).toHaveProperty('error')
    expect(parseHyperparameterValue(anyDefinition, 'a`id`')).toHaveProperty('error')
  })

  it('only accepts absolute or home-relative paths', () => {
    const pathDefinition = { ...intDefinition, type: 'path' as const, default: '' }
    expect(parseHyperparameterValue(pathDefinition, '~/.key')).toEqual({ value: '~/.key' })
    expect(parseHyperparameterValue(pathDefinition, '/users/me/.key')).toHaveProperty('value')
    expect(parseHyperparameterValue(pathDefinition, 'relative/.key')).toHaveProperty('error')
    expect(parseHyperparameterValue(pathDefinition, '~/a key')).toHaveProperty('error')
  })

  it('parses empty optional values to null', () => {
    const optionalDefinition = { ...intDefinition, required: false }
    expect(parseHyperparameterValue(optionalDefinition, '')).toEqual({ value: null })
  })

  it('only accepts true or false for booleans', () => {
    const boolDefinition = { ...intDefinition, type: 'bool' as const, default: true }
    expect(parseHyperparameterValue(boolDefinition, 'false')).toEqual({ value: false })
    expect(parseHyperparameterValue(boolDefinition, 'yes')).toHaveProperty('error')
  })
})

// Recipes without presets are checked once, without one
const getPresets = (r: TrainingRecipe): (HyperparameterPreset | undefined)[] =>
  r.hyperparameterPresets?.length ? r.hyperparameterPresets : [undefined]

describe('catalog', () => {
  it('has unique recipe ids and a script for every model and environment', () => {
    expect(new Set(RL_RECIPES.map((r) => r.id)).size).toBe(RL_RECIPES.length)
    RL_RECIPES.forEach((r) =>
      getPresets(r).forEach((preset) =>
        r.models.forEach((m) =>
          r.environments.forEach((e) => {
            const script = buildTrainingScript({
              recipe: r,
              model: m,
              environment: e,
              hyperparameters: getDefaultHyperparameters(r, m, preset),
              preset,
              monitoring: resolveMonitoring(r.monitoringDestinations[0], {}),
              jobOptions: { jobName: 'run', timeLimit: '01:00:00', nodes: r.nodes.default },
              runTracking: true,
            })
            expect(script).not.toContain('undefined')
            expect(script.trimEnd().endsWith('\\')).toBe(false)
          }),
        ),
      ),
    )
  })

  it('has valid defaults for every recipe, preset and model', () => {
    RL_RECIPES.forEach((r) =>
      getPresets(r).forEach((preset) =>
        r.models.forEach((m) => {
          const defaults = getDefaultHyperparameters(r, m, preset)
          const rawValues: Record<string, string> = {}
          getActiveHyperparameters(r, preset).forEach((d) => {
            rawValues[d.key] = String(defaults[d.key])
          })
          expect(parseHyperparameters(r, rawValues, preset).errors).toEqual({})
        }),
      ),
    )
  })

  it('only defines preset values for hyperparameters that apply with the preset', () => {
    RL_RECIPES.forEach((r) =>
      r.hyperparameterPresets?.forEach((preset) => {
        const keys = getActiveHyperparameters(r, preset).map((d) => d.key)
        Object.keys(preset.defaults).forEach((key) => expect(keys).toContain(key))
      }),
    )
  })
})

describe('NeMo-RL GSM8K blueprint (vLLM generation)', () => {
  it('offers one preset per .env profile, with its overridable values and defaults', () => {
    expect(apertus.hyperparameterPresets?.map((p) => p.id)).toEqual(['adamw', 'muon'])
    expect(getDefaultHyperparameters(apertus, apertusModel, adamw)).toEqual({
      TRAIN_NODES: 8,
      INFERENCE_NODES: 4,
      TRAIN_EXPERT_PARALLEL_SIZE: 32,
      MAX_NUM_STEPS: 58,
      NUM_PROMPTS: 128,
      GENERATIONS_PER_PROMPT: 16,
      UPDATES_PER_ROLLOUT: 4,
      INFERENCE_REQUESTS: 32,
      TRAIN_MICRO_BATCH: 1,
      TRAIN_MB_TOKENS: 4096,
      LOGPROB_MB_TOKENS: 4096,
      BASE_LR: 1.0e-6,
      MIN_LR: 5.0e-7,
    })
    expect(getDefaultHyperparameters(apertus, apertusModel, muon)).toEqual({
      TRAIN_NODES: 16,
      INFERENCE_NODES: 4,
      TRAIN_EXPERT_PARALLEL_SIZE: 64,
      MAX_NUM_STEPS: 58,
      NUM_PROMPTS: 128,
      GENERATIONS_PER_PROMPT: 16,
      UPDATES_PER_ROLLOUT: 4,
      INFERENCE_REQUESTS: 32,
      TRAIN_MICRO_BATCH: 1,
      TRAIN_MB_TOKENS: 2048,
      LOGPROB_MB_TOKENS: 4096,
      BASE_LR: 2.0e-7,
      MIN_LR: 0.0,
      MATRIX_LR: 5.0e-6,
      GAINS_LR: 2.0e-7,
    })
    expect(apertus.defaultTimeLimit).toBe('07:00:00')
  })

  it('derives the node count from training and generation nodes', () => {
    expect(isNodeCountConfigurable(apertus)).toBe(false)
    const defaults = getDefaultHyperparameters(apertus, apertusModel, adamw)
    expect(resolveNodeCount(apertus, defaults, '')).toEqual({ value: 12 })
    expect(
      resolveNodeCount(apertus, getDefaultHyperparameters(apertus, apertusModel, muon), ''),
    ).toEqual({ value: 20 })
    // A submitted node count is ignored when the recipe derives it
    expect(resolveNodeCount(apertus, { ...defaults, TRAIN_NODES: 2 }, '99')).toEqual({ value: 6 })
  })

  it('applies the blueprint checks between hyperparameters', () => {
    const raw = (overrides: Record<string, string>) => {
      const values: Record<string, string> = {}
      Object.entries(getDefaultHyperparameters(apertus, apertusModel, adamw)).forEach(
        ([key, value]) => {
          values[key] = String(value)
        },
      )
      return { ...values, ...overrides }
    }
    expect(
      Object.keys(parseHyperparameters(apertus, raw({ MIN_LR: '2e-6' }), adamw).errors),
    ).toEqual(['MIN_LR'])
    expect(
      Object.keys(parseHyperparameters(apertus, raw({ UPDATES_PER_ROLLOUT: '3' }), adamw).errors),
    ).toEqual(['UPDATES_PER_ROLLOUT'])
    expect(
      Object.keys(parseHyperparameters(apertus, raw({ TRAIN_NODES: '4' }), adamw).errors),
    ).toEqual(['TRAIN_EXPERT_PARALLEL_SIZE'])
    expect(parseHyperparameters(apertus, raw({ TRAIN_NODES: '16' }), adamw).errors).toEqual({})
  })

  it('runs the pinned blueprint launcher with the selected profile and values', () => {
    const script = buildApertusScript(muon, { MAX_NUM_STEPS: 3 })
    expect(script).toContain('#SBATCH --nodes=12')
    expect(script).toContain('#SBATCH --time=07:00:00')
    expect(script).toContain('#SBATCH --exclusive')
    expect(script).toContain('#SBATCH --cpus-per-task=288')
    expect(script).toContain(`remote add origin https://github.com/${TEST_SOURCE.repository}.git`)
    expect(script).toContain(`fetch --quiet --depth 1 origin ${TEST_SOURCE.commit}`)
    expect(script).toContain(
      'export CHONK_EXAMPLES_DIR="${BLUEPRINT_ROOT}/Alps-Images/apps/nemo-rl/example"',
    )
    // Run output stays in the working directory, not the blueprint's default location
    expect(script).toContain('export CHONK_RUN_ROOT="${JOB_WORKING_DIR}/${RUN_NAME}"')
    expect(script).toContain('BLUEPRINT_ROOT="${JOB_WORKING_DIR}/${RUN_NAME}/alps-extended-images"')
    expect(script.indexOf('export CHONK_RUN_ROOT')).toBeLessThan(script.indexOf('train.sh'))
    expect(script).toMatch(
      /^export NEMO_RL_IMAGE="jfrog\.svc\.cscs\.ch\/[^"]+\/nemo-rl-cuda:[^"]+"$/m,
    )
    expect(script).toContain(`export HF_MODEL="${apertusModel.modelPath}"`)
    expect(script).toContain('export MAX_NUM_STEPS="3"')
    expect(script).toContain('export MATRIX_LR="0.000005"')
    expect(script).toContain('export MIN_LR="0.0"')
    expect(buildApertusScript(adamw)).toContain('export MIN_LR="5.0e-7"')
    expect(buildApertusScript(adamw)).not.toContain('MATRIX_LR')
    expect(buildApertusScript(adamw).trimEnd().endsWith('--profile adamw')).toBe(true)
    expect(script).toContain('export WANDB_ENABLED="false"')
    expect(script.trimEnd().endsWith('train.sh" vllm/gsm8k --profile muon')).toBe(true)
  })

  it('enables W&B through environment variables', () => {
    const script = buildApertusScript(adamw, {}, 'wandb', {
      WANDB_PROJECT: 'my-project',
      WANDB_NAME: null,
      WANDB_RUN_GROUP: 'sweep-1',
      'wandb.mode': 'online',
      'wandb.apiKeyFile': '~/.wandb_api_key',
    })
    expect(script).toContain('export WANDB_ENABLED="true"')
    expect(script).toContain('export WANDB_PROJECT="my-project"')
    expect(script).toContain('export WANDB_RUN_GROUP="sweep-1"')
    expect(script).not.toContain('WANDB_NAME')
    expect(script).toContain('export WANDB_API_KEY="$(cat "${HOME}/.wandb_api_key")"')
  })
})

describe('run tracking', () => {
  const script = buildApertusScript(muon, { MAX_NUM_STEPS: 3 }, 'wandb', {
    WANDB_PROJECT: 'my-project',
    'wandb.mode': 'online',
    'wandb.apiKeyFile': '~/.wandb_api_key',
  })
  const runRecord = script.slice(script.indexOf('<<RUN_JSON'), script.indexOf('\nRUN_JSON\n'))

  it('writes <job id>-run.json and <job id>-result.json to the tracker directory', () => {
    expect(script).toContain(`RUN_TRACKER_DIR="${RUN_TRACKER_DIR}"`)
    // Written under a hidden temporary name, then renamed
    expect(script).toContain(
      'cat > "${RUN_TRACKER_DIR}/.${SLURM_JOB_ID}-run.json.tmp" <<RUN_JSON && mv -f "${RUN_TRACKER_DIR}/.${SLURM_JOB_ID}-run.json.tmp" "${RUN_TRACKER_DIR}/${SLURM_JOB_ID}-run.json"',
    )
    expect(script).toContain(
      'cat > "${RUN_TRACKER_DIR}/.${SLURM_JOB_ID}-result.json.tmp" <<RESULT_JSON && mv -f "${RUN_TRACKER_DIR}/.${SLURM_JOB_ID}-result.json.tmp" "${RUN_TRACKER_DIR}/${SLURM_JOB_ID}-result.json"',
    )
    expect(script).toContain('trap write_run_result EXIT')
    // Tracking is set up before the training starts
    expect(script.indexOf('# Run tracking')).toBeLessThan(script.indexOf('train.sh'))
  })

  it('records the recipe version, preset and values used, but nothing identifying a person', () => {
    expect(runRecord).toContain(`"version": "${TEST_SOURCE.commit}"`)
    expect(runRecord).toContain('"id": "muon"')
    expect(runRecord).toContain('"MAX_NUM_STEPS": 3')
    expect(runRecord).toContain('"destination": "wandb"')
    // No user, account, paths, job name or secret file
    expect(runRecord).not.toMatch(/USER|ACCOUNT|SUBMIT_DIR|my-run|wandb_api_key|capstor/)
  })

  it('records the partition and account for cloning, but not the reservation', () => {
    const tracked = buildTrainingScript({
      recipe: apertus,
      model: apertusModel,
      environment: apertus.environments[0],
      hyperparameters: getDefaultHyperparameters(apertus, apertusModel, adamw),
      preset: adamw,
      monitoring: resolveMonitoring(getDestination(apertus, 'tensorboard'), {}),
      jobOptions: {
        jobName: 'my-run',
        timeLimit: '07:00:00',
        nodes: 12,
        partition: 'debug',
        reservation: 'my-reservation',
      },
      account: 'a-csstaff',
      runTracking: true,
    })
    const record = tracked.slice(
      tracked.indexOf('\n', tracked.indexOf('<<RUN_JSON')) + 1,
      tracked.indexOf('\nRUN_JSON\n'),
    )
    expect(JSON.parse(record).launch.job).toEqual({
      nodes: 12,
      gpusPerNode: 4,
      timeLimit: '07:00:00',
      partition: 'debug',
      account: 'a-csstaff',
    })
    expect(record).not.toContain('my-reservation')
  })

  it('records the monitoring settings for cloning, but not secrets, paths or the run name', () => {
    const wandbScript = buildApertusScript(muon, {}, 'wandb', {
      WANDB_PROJECT: 'my-project',
      WANDB_NAME: 'my-wandb-run',
      WANDB_ENTITY: 'my-team',
      'wandb.mode': 'offline',
      'wandb.apiKeyFile': '~/.wandb_api_key',
      'wandb.publishLink': 'false',
    })
    const record = wandbScript.slice(
      wandbScript.indexOf('\n', wandbScript.indexOf('<<RUN_JSON')) + 1,
      wandbScript.indexOf('\nRUN_JSON\n'),
    )
    expect(JSON.parse(record).launch.monitoring).toEqual({
      destination: 'wandb',
      settings: {
        WANDB_PROJECT: 'my-project',
        WANDB_ENTITY: 'my-team',
        'wandb.mode': 'offline',
        'wandb.publishLink': 'false',
      },
    })
  })

  describe('W&B link', () => {
    const buildWandbScript = (values: Record<string, string | null>) => {
      const wandbScript = buildApertusScript(muon, {}, 'wandb', {
        WANDB_PROJECT: 'my-project',
        WANDB_ENTITY: 'my-team',
        'wandb.mode': 'online',
        'wandb.apiKeyFile': '~/.wandb_api_key',
        'wandb.publishLink': 'true',
        ...values,
      })
      return {
        script: wandbScript,
        runRecord: wandbScript.slice(
          wandbScript.indexOf('<<RUN_JSON'),
          wandbScript.indexOf('\nRUN_JSON\n'),
        ),
      }
    }

    it('is recorded when chosen, with a run id fixed in advance', () => {
      const { script, runRecord } = buildWandbScript({})
      expect(script).toContain(
        'export WANDB_RUN_ID="${SLURM_CLUSTER_NAME:-unknown}-${SLURM_JOB_ID}"',
      )
      // The run id expands in the heredoc
      expect(runRecord).toContain(
        '"url": "https://wandb.ai/my-team/my-project/runs/${SLURM_CLUSTER_NAME:-unknown}-${SLURM_JOB_ID}"',
      )
      expect(buildWandbScript({ 'wandb.host': 'https://wandb.example.org/' }).runRecord).toContain(
        '"url": "https://wandb.example.org/my-team/my-project/runs/',
      )
    })

    it('uses the default entity of the API key, looked up by the job, when none is chosen', () => {
      const { script, runRecord } = buildWandbScript({ WANDB_ENTITY: null })
      expect(runRecord).toContain(
        '"url": "https://wandb.ai/${WANDB_LINK_ENTITY}/my-project/runs/${SLURM_CLUSTER_NAME:-unknown}-${SLURM_JOB_ID}"',
      )
      const lookup = script.split('\n').find((line) => line.startsWith('WANDB_LINK_ENTITY='))!
      // Before the run file, which needs it
      expect(script.indexOf(lookup)).toBeLessThan(script.indexOf('<<RUN_JSON'))
      expect(lookup).toContain('https://api.wandb.ai/graphql')
      // The key goes to curl on stdin, never as an argument
      expect(lookup).toContain(
        `printf 'user = "api:%s"\\n' "$(cat "\${HOME}/.wandb_api_key" 2>/dev/null)" | curl`,
      )
      expect(lookup).toContain('curl -sf --max-time 20 -K - ')
      // Not needed when the entity is chosen
      expect(buildWandbScript({}).script).not.toContain('WANDB_LINK_ENTITY')
    })

    it('is left out when not chosen or not known', () => {
      const cases: Record<string, string | null>[] = [
        { 'wandb.publishLink': 'false' },
        { 'wandb.mode': 'offline' },
        { 'wandb.host': 'http://wandb.example.org' },
      ]
      cases.forEach((values) => {
        const { script, runRecord } = buildWandbScript(values)
        expect(runRecord).not.toContain('"url"')
        expect(script).not.toContain('WANDB_RUN_ID')
      })
    })
  })

  it('reports the metrics from the event files while the job runs and when it ends', () => {
    expect(script).toContain(
      'RUN_METRICS_DIR="${JOB_WORKING_DIR}/my-run-${SLURM_JOB_ID}/job-${SLURM_JOB_ID}/nemo-rl-logs"',
    )
    // The reader is embedded verbatim, in a quoted heredoc
    expect(script).toContain(
      `<<'RUN_METRICS_PY' || true\n${TENSORBOARD_METRICS_READER}\nRUN_METRICS_PY\n`,
    )
    expect(TENSORBOARD_METRICS_READER).not.toMatch(/^RUN_METRICS_PY$/m)
    expect(script).toContain('(while sleep 600; do write_run_metrics; done) &')
    expect(script).toContain('"${RUN_TRACKER_DIR}/${SLURM_JOB_ID}-metrics.json"')
    expect(script).toContain('  "metrics": ${metrics:-null}')
    // Stopped before the result is written, so it doesn't report after it
    expect(script.indexOf('kill "${RUN_METRICS_PID}"')).toBeLessThan(
      script.indexOf('<<RESULT_JSON'),
    )
  })

  it('uses the directory the job starts in, not SLURM_SUBMIT_DIR, which is home via FirecREST', () => {
    expect(script).toContain('JOB_WORKING_DIR="$(pwd)"')
    expect(script.indexOf('JOB_WORKING_DIR="$(pwd)"')).toBeLessThan(
      script.indexOf('${JOB_WORKING_DIR}'),
    )
    RL_RECIPES.forEach((r) =>
      r.models.forEach((m) => {
        const recipeScript = buildTrainingScript({
          recipe: r,
          model: m,
          environment: r.environments[0],
          hyperparameters: getDefaultHyperparameters(r, m, r.hyperparameterPresets?.[0]),
          preset: r.hyperparameterPresets?.[0],
          monitoring: resolveMonitoring(r.monitoringDestinations[0], {}),
          jobOptions: { jobName: 'run', timeLimit: '01:00:00', nodes: r.nodes.default },
          runTracking: true,
        })
        expect(recipeScript).not.toContain('SLURM_SUBMIT_DIR')
      }),
    )
  })

  it('restores USER and HOME before anything uses them', () => {
    expect(script).toContain('export USER="${USER:-$(id -un)}"')
    expect(script).toContain('export HOME="${HOME:-$(getent passwd "${USER}" | cut -d: -f6)}"')
    expect(script.indexOf('export HOME=')).toBeLessThan(script.indexOf('# Run tracking'))
  })

  it('is left out when turned off', () => {
    const untracked = buildApertusScript(muon, {}, 'tensorboard', {}, false)
    expect(untracked).not.toMatch(/RUN_TRACKER_DIR|write_run_result|rl-runs-tracker/)
    expect(untracked).toContain('train.sh')
  })

  it('is on unless the launch turns it off', () => {
    expect(validateRlTrainingLaunch(buildFormData(), RL_RECIPES).runTracking).toBe(true)
    expect(
      validateRlTrainingLaunch(buildFormData({ runTracking: 'true' }), RL_RECIPES).runTracking,
    ).toBe(true)
    expect(
      validateRlTrainingLaunch(buildFormData({ runTracking: 'false' }), RL_RECIPES).runTracking,
    ).toBe(false)
  })
})

describe('validateRlTrainingLaunch', () => {
  it('resolves the recipe from the catalog and derives the node count', () => {
    const launch = validateRlTrainingLaunch(
      buildFormData({ 'hp.TRAIN_NODES': '16', 'hp.MAX_NUM_STEPS': '12' }),
      RL_RECIPES,
    )
    expect(launch.recipe.id).toBe(apertus.id)
    expect(launch.hyperparameters['MAX_NUM_STEPS']).toBe(12)
    expect(launch.monitoring.destination.id).toBe('wandb')
    expect(launch.monitoring.secretFiles).toEqual({ WANDB_API_KEY: '${HOME}/.wandb_api_key' })
    expect(launch.jobOptions).toEqual({
      jobName: 'my-run',
      timeLimit: '07:00:00',
      nodes: 20,
      partition: undefined,
      reservation: undefined,
    })
  })

  it('reports every invalid field', () => {
    expect.assertions(2)
    try {
      validateRlTrainingLaunch(
        buildFormData({
          modelId: 'unknown-model',
          jobName: 'bad name; rm -rf ~',
          timeLimit: 'forever',
          'hp.MAX_NUM_STEPS': 'abc',
          'mon.WANDB_PROJECT': 'bad"project',
          'mon.wandb.apiKeyFile': '$(id)',
        }),
        RL_RECIPES,
      )
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError)
      expect((error as ValidationError).inner.map((e) => e.path).sort()).toEqual(
        [
          'hp.MAX_NUM_STEPS',
          'jobName',
          'modelId',
          'timeLimit',
          'mon.WANDB_PROJECT',
          'mon.wandb.apiKeyFile',
        ].sort(),
      )
    }
  })

  it('requires a preset and only reads the values that apply with it', () => {
    expect.assertions(3)
    try {
      validateRlTrainingLaunch(buildFormData({ presetId: 'sgd' }), RL_RECIPES)
    } catch (error) {
      expect((error as ValidationError).inner.map((e) => e.path)).toEqual(['presetId'])
    }
    const launch = validateRlTrainingLaunch(
      buildFormData({ presetId: 'muon', 'hp.MATRIX_LR': '1e-5', 'hp.GAINS_LR': '1e-7' }),
      RL_RECIPES,
    )
    expect(launch.preset?.id).toBe('muon')
    expect(launch.hyperparameters['MATRIX_LR']).toBe(1e-5)
  })

  it('reports checks between hyperparameters on the field', () => {
    expect.assertions(1)
    try {
      validateRlTrainingLaunch(buildFormData({ 'hp.MIN_LR': '0.1' }), RL_RECIPES)
    } catch (error) {
      expect((error as ValidationError).inner.map((e) => e.path)).toEqual(['hp.MIN_LR'])
    }
  })
})
