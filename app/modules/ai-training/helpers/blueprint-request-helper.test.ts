/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import {
  getBlueprintRequestCard,
  getBlueprintRequestUrl,
} from '~/modules/ai-training/helpers/blueprint-request-helper'
import type { BlueprintRequestStep } from '~/modules/ai-training/helpers/blueprint-request-helper'
import { getRlRecipe } from '~/modules/ai-training/recipes/rl-recipes'
import {
  NEMO_RL_VLLM_RECIPE_ID,
  TEST_RECIPES,
  TEST_SOURCE,
} from '~/modules/ai-training/recipes/__fixtures__/test-recipes'

const recipe = getRlRecipe(TEST_RECIPES, NEMO_RL_VLLM_RECIPE_ID)!
const STEPS: BlueprintRequestStep[] = [
  'recipe',
  'model',
  'environment',
  'preset',
  'monitoring',
  'launch',
]

describe('getBlueprintRequestUrl', () => {
  it('opens a new issue in the blueprints repository, filled in for the step', () => {
    const url = new URL(getBlueprintRequestUrl('eth-cscs/alps-extended-images', 'model', recipe))
    expect(`${url.origin}${url.pathname}`).toBe(
      'https://github.com/eth-cscs/alps-extended-images/issues/new',
    )
    expect(url.searchParams.get('title')).toBe(`Blueprint request: model for ${recipe.name}`)
    const body = url.searchParams.get('body')!
    expect(body).toContain('### Request')
    expect(body).toContain(`- Recipe: ${recipe.name} (\`${recipe.id}\`)`)
    expect(body).toContain(`- Blueprint version: \`${TEST_SOURCE.commit.slice(0, 7)}\``)
    expect(body).toContain(`- Models offered: ${recipe.models[0].name}`)
  })

  it('asks for a new recipe without the context of a selected one', () => {
    const url = new URL(getBlueprintRequestUrl('eth-cscs/alps-extended-images', 'recipe'))
    expect(url.searchParams.get('title')).toBe('Blueprint request: new recipe')
    expect(url.searchParams.get('body')).not.toContain('### Context')
  })

  it('has a card for every step', () => {
    STEPS.forEach((step) => {
      expect(getBlueprintRequestCard(step).title).toBeTruthy()
      expect(getBlueprintRequestUrl('o/r', step, recipe).length).toBeLessThan(4000)
    })
  })
})
