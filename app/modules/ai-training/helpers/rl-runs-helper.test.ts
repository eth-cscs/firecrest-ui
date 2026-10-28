/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import {
  formatDuration,
  getChangedHyperparameters,
  getCloneUrl,
  getJobUrl,
  getLaunchPrefill,
  parseCloneSource,
  parseRunIndex,
  sortRuns,
} from '~/modules/ai-training/helpers/rl-runs-helper'
import { getRlRecipe } from '~/modules/ai-training/recipes/rl-recipes'
import {
  NEMO_RL_VLLM_RECIPE_ID,
  TEST_RECIPES as RECIPES,
} from '~/modules/ai-training/recipes/__fixtures__/test-recipes'
import type { RlRunSummary } from '~/types/ai-training'

const RECIPE = NEMO_RL_VLLM_RECIPE_ID
const RUN_ID = 'clariden-3752975'
const apertus = getRlRecipe(RECIPES, RECIPE)!

const entry = (overrides: Record<string, unknown> = {}) => ({
  runId: RUN_ID,
  cluster: 'clariden',
  jobId: '3752975',
  path: `${RECIPE}/${RUN_ID}.json`,
  status: 'completed',
  startedOn: '2026-10-26',
  endedOn: '2026-10-26',
  elapsedSeconds: 4814,
  recipeVersion: apertus.version,
  model: 'apertus-2-chonk',
  environment: 'gsm8k',
  preset: 'muon',
  hyperparameters: { MAX_NUM_STEPS: 3, BASE_LR: 2e-7, MATRIX_LR: 5e-6 },
  monitoring: 'tensorboard',
  nodes: 20,
  gpusPerNode: 4,
  timeLimit: '07:00:00',
  metrics: { 'val:accuracy': 0.907 },
  ...overrides,
})

const run = (overrides: Record<string, unknown> = {}): RlRunSummary =>
  parseRunIndex(RECIPE, { runs: [entry(overrides)] })[0]

describe('parseRunIndex', () => {
  it('reads the published entries of a recipe', () => {
    expect(run()).toMatchObject({
      recipeId: RECIPE,
      runId: RUN_ID,
      status: 'completed',
      preset: 'muon',
      hyperparameters: { MAX_NUM_STEPS: 3 },
      metrics: { 'val:accuracy': 0.907 },
    })
  })

  it('reads every status the collector publishes', () => {
    const statuses = ['completed', 'failed', 'terminated', 'preempted', 'running', 'unknown']
    expect(statuses.map((status) => run({ status }).status)).toEqual(statuses)
  })

  it('drops entries and fields that do not have the expected shape', () => {
    const runs = parseRunIndex(RECIPE, {
      runs: [
        entry({ runId: '../x' }),
        entry({ jobId: '999' }),
        entry({ jobId: 3752975 }),
        entry({ cluster: '../x', runId: '../x-3752975' }),
        entry({ status: 'pwned' }),
        'garbage',
        entry({
          model: '<script>',
          startedOn: 'yesterday',
          timeLimit: '7 hours',
          hyperparameters: { OK: 1, BAD: { nested: true } },
          metrics: { ok: 1, bad: 'x' },
        }),
      ],
    })
    expect(runs).toHaveLength(1)
    expect(runs[0]).toMatchObject({
      model: null,
      startedOn: null,
      timeLimit: null,
      hyperparameters: { OK: 1 },
      metrics: { ok: 1 },
    })
    expect(parseRunIndex(RECIPE, { runs: 'nope' })).toEqual([])
    expect(parseRunIndex(RECIPE, null)).toEqual([])
  })

  it('sorts runs newest first across recipes', () => {
    const runs = sortRuns([
      run({ startedOn: '2026-10-20' }),
      {
        ...run({ startedOn: '2026-10-26', runId: 'clariden-1', jobId: '1' }),
        recipeId: 'nemo-rl-apertus2-moe-gsm8k-megatron',
      },
      run({ startedOn: '2026-10-26' }),
    ])
    // Within a day, by recipe id
    expect(runs.map((r) => [r.recipeId, r.startedOn])).toEqual([
      ['nemo-rl-apertus2-moe-gsm8k-megatron', '2026-10-26'],
      [RECIPE, '2026-10-26'],
      [RECIPE, '2026-10-20'],
    ])
  })
})

describe('monitoring links', () => {
  it('are only kept when they point to the run', () => {
    const url = `https://wandb.example.org/wandb/my-team/my-project/runs/${RUN_ID}`
    expect(run({ monitoringUrl: url }).monitoringUrl).toBe(url)
    expect(run().monitoringUrl).toBeNull()
    ;[
      `https://wandb.ai/my-team/my-project/runs/clariden-1`,
      `http://wandb.ai/my-team/my-project/runs/${RUN_ID}`,
      `https://wandb.ai/my-project/runs/${RUN_ID}`,
      `https://wandb.ai/my-team/my-project/runs/${RUN_ID}?x=1`,
      `javascript:alert(1)//a/b/runs/${RUN_ID}`,
      42,
    ].forEach((monitoringUrl) => expect(run({ monitoringUrl }).monitoringUrl).toBeNull())
  })
})

describe('getJobUrl', () => {
  it('links to the job through the route that finds its account', () => {
    expect(getJobUrl(run())).toBe('/compute/systems/clariden/jobs/3752975')
  })
})

describe('cloning', () => {
  it('links to the launch page and only accepts known recipes and run ids back', () => {
    const url = getCloneUrl(run())
    expect(url).toBe(`/ai-training/rl/new?from=${encodeURIComponent(`${RECIPE}/${RUN_ID}`)}`)
    const from = new URL(url, 'http://x').searchParams.get('from')
    expect(parseCloneSource(from, RECIPES)).toEqual({ recipeId: RECIPE, runId: RUN_ID })
    expect(parseCloneSource(`unknown/${RUN_ID}`, RECIPES)).toBeNull()
    expect(parseCloneSource(`${RECIPE}/abc`, RECIPES)).toBeNull()
    expect(parseCloneSource(`${RECIPE}/${RUN_ID}/x`, RECIPES)).toBeNull()
    expect(parseCloneSource(null, RECIPES)).toBeNull()
  })

  it('takes over the selections and values of the run, marking those that differ', () => {
    const prefill = getLaunchPrefill(run(), RECIPES)!
    expect(prefill).toMatchObject({
      recipeId: RECIPE,
      modelId: 'apertus-2-chonk',
      environmentId: 'gsm8k',
      presetId: 'muon',
      monitoringDestinationId: 'tensorboard',
      timeLimit: '07:00:00',
      // The node count follows from the hyperparameters for this recipe
      nodes: null,
      notes: [],
    })
    expect(prefill.hyperparameterValues).toMatchObject({
      MAX_NUM_STEPS: '3',
      BASE_LR: '2.0e-7',
      MATRIX_LR: '0.000005',
    })
    // BASE_LR and MATRIX_LR are the Muon preset's defaults
    expect(prefill.editedKeys).toEqual(['MAX_NUM_STEPS'])
  })

  it('falls back to defaults, with a note, for what no longer fits the recipe', () => {
    const prefill = getLaunchPrefill(
      run({
        recipeVersion: 'v0.0.1',
        model: 'retired-model',
        preset: 'sgd',
        monitoring: 'wandb',
        hyperparameters: { MAX_NUM_STEPS: -5, REMOVED_KEY: 1 },
      }),
      RECIPES,
    )!
    expect(prefill.modelId).toBeNull()
    expect(prefill.presetId).toBeNull()
    expect(prefill.editedKeys).toEqual([])
    expect(prefill.notes.join('\n')).toMatch(/version v0\.0\.1/)
    expect(prefill.notes.join('\n')).toMatch(/model \(retired-model\) is no longer offered/)
    expect(prefill.notes.join('\n')).toMatch(/preset \(sgd\) is no longer offered/)
    expect(prefill.notes.join('\n')).toMatch(/no longer valid .*Steps|no longer valid/)
    expect(prefill.notes.join('\n')).toMatch(/1 recorded values no longer exist/)
    expect(prefill.notes.join('\n')).toMatch(/Weights & Biases settings were not recorded/)
  })

  it('takes over the recorded monitoring settings that are still valid', () => {
    const prefill = getLaunchPrefill(
      run({
        monitoring: 'wandb',
        monitoringSettings: {
          WANDB_PROJECT: 'my-project',
          WANDB_ENTITY: 'bad"entity',
          'wandb.mode': 'offline',
          'wandb.publishLink': 'false',
        },
      }),
      RECIPES,
    )!
    expect(prefill.monitoringDestinationId).toBe('wandb')
    expect(prefill.monitoringValues).toMatchObject({
      WANDB_PROJECT: 'my-project',
      WANDB_ENTITY: '',
      'wandb.mode': 'offline',
      'wandb.publishLink': 'false',
      'wandb.apiKeyFile': '~/.wandb_api_key',
    })
    expect(prefill.notes.join('\n')).toMatch(/no longer valid were replaced by defaults: Entity/)
    expect(prefill.notes.join('\n')).toMatch(/API key file are not recorded/)
  })

  it('ignores runs of unknown recipes', () => {
    expect(getLaunchPrefill({ ...run(), recipeId: 'unknown' }, RECIPES)).toBeNull()
  })
})

describe('run summaries', () => {
  it('list the values changed from the defaults of the run’s preset', () => {
    expect(getChangedHyperparameters(run(), RECIPES).map((c) => [c.key, c.value])).toEqual([
      ['MAX_NUM_STEPS', '3'],
    ])
    expect(getChangedHyperparameters(run({ hyperparameters: {} }), RECIPES)).toEqual([])
  })

  it('format durations compactly', () => {
    expect(formatDuration(4814)).toBe('1h 20m')
    expect(formatDuration(136)).toBe('2m 16s')
    expect(formatDuration(9)).toBe('9s')
    expect(formatDuration(null)).toBeNull()
  })
})
