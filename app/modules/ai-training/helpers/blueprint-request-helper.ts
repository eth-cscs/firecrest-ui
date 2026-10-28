/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { shortVersion } from '~/modules/ai-training/helpers/rl-runs-helper'
// types
import type { TrainingRecipe } from '~/types/ai-training'

// Requests and feedback for the launch form's steps go to the issues of the repository the
// blueprints come from, as a new issue pre-filled with what is asked and the blueprint it is for

export type BlueprintRequestStep =
  | 'recipe'
  | 'model'
  | 'environment'
  | 'preset'
  | 'monitoring'
  | 'launch'

interface BlueprintRequestKind {
  cardTitle: string
  cardDescription: string
  issueTitle: string
  // What the issue asks, shown as the first prompt of its body
  prompt: string
}

const REQUEST_KINDS: Record<BlueprintRequestStep, BlueprintRequestKind> = {
  recipe: {
    cardTitle: 'Request a recipe',
    cardDescription:
      'Missing an algorithm, framework or setup, or feedback on these recipes? Opens a pre-filled GitHub issue.',
    issueTitle: 'Blueprint request: new recipe',
    prompt:
      'Which algorithm, framework or setup (e.g. sync or async, training and generation engines) should a new blueprint cover?',
  },
  model: {
    cardTitle: 'Request a model',
    cardDescription: 'Missing a model, or feedback on these? Opens a pre-filled GitHub issue.',
    issueTitle: 'Blueprint request: model',
    prompt: 'Which model should be supported? A link to its checkpoint helps.',
  },
  environment: {
    cardTitle: 'Request an environment or dataset',
    cardDescription:
      'Missing an environment or dataset, or feedback on these? Opens a pre-filled GitHub issue.',
    issueTitle: 'Blueprint request: environment or dataset',
    prompt: 'Which environment or dataset should be supported? A link to it helps.',
  },
  preset: {
    cardTitle: 'Request a preset or setting',
    cardDescription:
      'Missing a preset or a hyperparameter, or feedback on the defaults? Opens a pre-filled GitHub issue.',
    issueTitle: 'Blueprint request: preset or hyperparameter',
    prompt: 'Which preset or hyperparameter should be added, or which defaults should change?',
  },
  monitoring: {
    cardTitle: 'Request a monitoring option',
    cardDescription:
      'Missing a monitoring destination or setting, or feedback on these? Opens a pre-filled GitHub issue.',
    issueTitle: 'Blueprint request: monitoring',
    prompt: 'Which monitoring destination or setting should be supported?',
  },
  launch: {
    cardTitle: 'Send feedback',
    cardDescription:
      'Something missing or not working when launching? Opens a pre-filled GitHub issue.',
    issueTitle: 'Blueprint feedback: launching runs',
    prompt: 'What is missing or not working?',
  },
}

export const getBlueprintRequestCard = (step: BlueprintRequestStep) => {
  const { cardTitle, cardDescription } = REQUEST_KINDS[step]
  return { title: cardTitle, description: cardDescription }
}

// Link to a new issue in the repository (GitHub owner/name), with the title and body filled in
export const getBlueprintRequestUrl = (
  repository: string,
  step: BlueprintRequestStep,
  recipe?: TrainingRecipe,
) => {
  const { issueTitle, prompt } = REQUEST_KINDS[step]
  const context = recipe
    ? [
        `- Recipe: ${recipe.name} (\`${recipe.id}\`)`,
        ...(recipe.version ? [`- Blueprint version: \`${shortVersion(recipe.version)}\``] : []),
        ...(step === 'model'
          ? [`- Models offered: ${recipe.models.map((m) => m.name).join(', ')}`]
          : []),
        ...(step === 'environment'
          ? [`- Offered: ${recipe.environments.map((e) => e.name).join(', ')}`]
          : []),
        ...(step === 'preset' && recipe.hyperparameterPresets?.length
          ? [`- Presets offered: ${recipe.hyperparameterPresets.map((p) => p.name).join(', ')}`]
          : []),
        ...(step === 'monitoring'
          ? [`- Offered: ${recipe.monitoringDestinations.map((d) => d.name).join(', ')}`]
          : []),
      ]
    : []
  const body = [
    '### Request',
    '',
    `<!-- ${prompt} -->`,
    '',
    '### Why',
    '',
    '<!-- What would you use it for? Links to papers, checkpoints or datasets help. -->',
    '',
    ...(context.length > 0 ? ['### Context', '', ...context, ''] : []),
    '_Sent from the AI Training page of the FirecREST UI._',
  ].join('\n')
  const title = recipe && step !== 'recipe' ? `${issueTitle} for ${recipe.name}` : issueTitle
  const query = new URLSearchParams({ title, body })
  return `https://github.com/${repository}/issues/new?${query.toString()}`
}
