/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

// The recipe catalog as the pages build it, from a copy of the published blueprint index
// (alps-extended-images Alps-Images/apps/nemo-rl/blueprints/index.json at TEST_SOURCE.commit)
import blueprintIndex from '~/modules/ai-training/recipes/__fixtures__/nemo-rl-blueprints-index.json'
import {
  type NemoRlBlueprintCatalog,
  parseBlueprintIndex,
} from '~/modules/ai-training/recipes/nemo-rl-blueprints'
import { getRlRecipes } from '~/modules/ai-training/recipes/rl-recipes'

export const TEST_SOURCE = {
  repository: 'eth-cscs/alps-extended-images',
  commit: 'b956397f30e3639754e359c2eebcffa7671303b7',
}

export const TEST_BLUEPRINT_INDEX: unknown = blueprintIndex

export const TEST_CATALOG: NemoRlBlueprintCatalog = {
  source: TEST_SOURCE,
  blueprints: parseBlueprintIndex(blueprintIndex).blueprints,
  error: null,
}

export const TEST_RECIPES = getRlRecipes(TEST_CATALOG)

// The vLLM GSM8K blueprint, the setup the hard-coded recipe used to describe
export const NEMO_RL_VLLM_RECIPE_ID = 'nemo-rl-apertus2-moe-gsm8k-vllm'
