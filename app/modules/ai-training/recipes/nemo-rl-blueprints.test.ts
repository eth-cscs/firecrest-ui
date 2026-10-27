/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import {
  getDefaultHyperparameters,
  getHyperparameterPreset,
  parseHyperparameters,
} from '~/modules/ai-training/helpers/rl-recipe-helper'
import {
  blueprintToRecipe,
  getBlueprintRecipes,
  parseBlueprintIndex,
} from '~/modules/ai-training/recipes/nemo-rl-blueprints'
import {
  TEST_BLUEPRINT_INDEX,
  TEST_CATALOG,
  TEST_SOURCE,
} from '~/modules/ai-training/recipes/__fixtures__/test-recipes'

type Json = Record<string, any>

const index = () => JSON.parse(JSON.stringify(TEST_BLUEPRINT_INDEX)) as Json
const vllmOf = (data: Json) => data.blueprints.find((b: Json) => b.id === 'apertus2-moe-gsm8k-vllm')
const recipe = () => blueprintToRecipe(TEST_SOURCE, vllmOf(parseBlueprintIndex(index())))

describe('parseBlueprintIndex', () => {
  it('reads the published blueprints', () => {
    const { blueprints, skipped } = parseBlueprintIndex(index())
    expect(skipped).toEqual([])
    expect(blueprints.map((b) => b.id).sort()).toEqual([
      'apertus2-moe-gsm8k-megatron',
      'apertus2-moe-gsm8k-vllm',
    ])
  })

  it('rejects an index it does not know', () => {
    expect(parseBlueprintIndex({ schemaVersion: 2, blueprints: [] }).blueprints).toEqual([])
    expect(parseBlueprintIndex('garbage').blueprints).toEqual([])
  })

  // Each change would put something into a batch script that the checks must keep out
  it.each([
    ['a multi-line name', (b: Json) => (b.name = 'GRPO\nrm -rf ~')],
    ['an image with a quote', (b: Json) => (b.launch.image = 'img:tag"; id; "')],
    ['a recipe path that leaves the example', (b: Json) => (b.launch.recipe = '../../x')],
    ['a model path with spaces', (b: Json) => (b.models[0].path = '/a b')],
    ['a model path with a variable', (b: Json) => (b.models[0].path = '/$(id)')],
    ['an environment value with a quote', (b: Json) => (b.monitoring[0].environment.X = 'a"b')],
    ['an invalid variable name', (b: Json) => (b.parameters[0].key = 'PATH;id')],
    ['an sbatch option with a space', (b: Json) => (b.resources.sbatch = ['--x=1 --y'])],
    ['a non-numeric default', (b: Json) => (b.profiles[0].defaults.TRAIN_NODES = '8')],
    ['a rule over an undeclared value', (b: Json) => (b.rules[0].value = 'UNKNOWN')],
    [
      'a profile without a value of its parameters',
      (b: Json) => delete b.profiles[0].defaults.BASE_LR,
    ],
  ])('skips a blueprint with %s, keeping the others', (_, change) => {
    const data = index()
    change(vllmOf(data))
    const { blueprints, skipped } = parseBlueprintIndex(data)
    expect(blueprints.map((b) => b.id)).toEqual(['apertus2-moe-gsm8k-megatron'])
    expect(skipped).toHaveLength(1)
  })
})

describe('blueprintToRecipe', () => {
  it('offers each profile as a preset with its defaults and reference runs', () => {
    const r = recipe()
    expect(r.id).toBe('nemo-rl-apertus2-moe-gsm8k-vllm')
    expect(r.version).toBe(TEST_SOURCE.commit)
    expect(r.hyperparameterPresets?.map((p) => p.id)).toEqual(['adamw', 'muon'])
    const muon = getHyperparameterPreset(r, 'muon')!
    expect(muon.description).toBe('Muon with MD decoupling.')
    const defaults = getDefaultHyperparameters(r, r.models[0], muon)
    expect(defaults).toMatchObject({ TRAIN_NODES: 16, MATRIX_LR: 5.0e-6 })
    // Muon-only values don't apply with AdamW
    const adamwDefaults = getDefaultHyperparameters(
      r,
      r.models[0],
      getHyperparameterPreset(r, 'adamw'),
    )
    expect(adamwDefaults).not.toHaveProperty('MATRIX_LR')
    expect(r.getNodeCount?.(defaults)).toBe(20)
    expect(r.nodeCountDescription).toBe(
      'Training nodes + Generation nodes, set in the hyperparameters',
    )
    expect(r.defaultTimeLimit).toBe('07:00:00')
  })

  it('checks the rules between parameters', () => {
    const r = recipe()
    const adamw = getHyperparameterPreset(r, 'adamw')!
    const raw = (overrides: Record<string, string>) => {
      const values: Record<string, string> = {}
      Object.entries(getDefaultHyperparameters(r, r.models[0], adamw)).forEach(([key, value]) => {
        values[key] = String(value)
      })
      return { ...values, ...overrides }
    }
    expect(parseHyperparameters(r, raw({}), adamw).errors).toEqual({})
    expect(Object.keys(parseHyperparameters(r, raw({ MIN_LR: '1e-5' }), adamw).errors)).toEqual([
      'MIN_LR',
    ])
    expect(
      Object.keys(parseHyperparameters(r, raw({ TRAIN_EXPERT_PARALLEL_SIZE: '24' }), adamw).errors),
    ).toEqual(['TRAIN_EXPERT_PARALLEL_SIZE'])
  })

  it('adds the W&B API key file to the W&B destination', () => {
    const wandb = recipe().monitoringDestinations.find((d) => d.id === 'wandb')!
    const targets = wandb.parameters.map((p) => p.target)
    expect(targets).toContainEqual({ kind: 'secretFile', name: 'WANDB_API_KEY' })
    // Declared by the blueprint, so not added a second time
    expect(targets.filter((t) => t.kind === 'env' && t.name === 'WANDB_ENTITY')).toHaveLength(1)
  })

  it('builds no recipes when the blueprints could not be loaded', () => {
    expect(getBlueprintRecipes(null)).toEqual([])
    expect(getBlueprintRecipes({ ...TEST_CATALOG, blueprints: [], error: 'x' })).toEqual([])
  })
})
