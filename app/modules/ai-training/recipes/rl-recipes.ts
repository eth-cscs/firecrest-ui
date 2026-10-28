/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

// Catalog of reinforcement learning training recipes offered on the AI Training > RL page.
// A recipe bundles a training framework entrypoint with the models, environments/datasets and
// hyperparameters it supports, plus a builder for the batch script body. Recipes come from the
// blueprints published in alps-extended-images (see nemo-rl-blueprints.ts), so the catalog is
// built from what the server loaded.

// types
import type { TrainingRecipe } from '~/types/ai-training'
// recipes
import {
  type NemoRlBlueprintCatalog,
  getBlueprintRecipes,
} from '~/modules/ai-training/recipes/nemo-rl-blueprints'

export const getRlRecipes = (nemoRl: NemoRlBlueprintCatalog | null): TrainingRecipe[] =>
  getBlueprintRecipes(nemoRl)

export const getRlRecipe = (recipes: TrainingRecipe[], recipeId: string) =>
  recipes.find((recipe: TrainingRecipe) => recipe.id === recipeId)
