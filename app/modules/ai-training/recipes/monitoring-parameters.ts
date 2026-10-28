/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

// Monitoring parameters and validation patterns shared by the recipe definitions

// types
import type { MonitoringParameter, ResolvedMonitoring } from '~/types/ai-training'

export const NAME_PATTERN = '[A-Za-z0-9._-]{1,128}'
export const NAME_PATTERN_MESSAGE = 'Use 1-128 letters, digits, ".", "_" or "-"'
export const URL_PATTERN = 'https?://[A-Za-z0-9.:/_-]+'
export const URL_PATTERN_MESSAGE = 'Must be an http(s) URL'

const WANDB_PUBLISH_LINK_KEY = 'wandb.publishLink'

// Monitoring parameters that only map to environment variables or secret files, shared by
// recipes whose frameworks all read them the same way
export const wandbEnvironmentParameters = (): MonitoringParameter[] => [
  {
    key: 'wandb.entity',
    label: 'Entity',
    description: 'Team or user owning the project. Defaults to your W&B default entity.',
    group: 'Weights & Biases',
    type: 'string',
    default: '',
    required: false,
    placeholder: 'my-team',
    pattern: NAME_PATTERN,
    patternMessage: NAME_PATTERN_MESSAGE,
    target: { kind: 'env', name: 'WANDB_ENTITY' },
  },
  {
    key: 'wandb.mode',
    label: 'Mode',
    description: 'Use offline when compute nodes have no internet access.',
    group: 'Weights & Biases',
    type: 'choice',
    default: 'online',
    choices: ['online', 'offline'],
    target: { kind: 'env', name: 'WANDB_MODE' },
  },
  {
    key: 'wandb.host',
    label: 'Server URL',
    description: 'Only for self-hosted W&B servers.',
    group: 'Weights & Biases',
    type: 'string',
    default: '',
    required: false,
    placeholder: 'https://wandb.example.org',
    pattern: URL_PATTERN,
    patternMessage: URL_PATTERN_MESSAGE,
    target: { kind: 'env', name: 'WANDB_BASE_URL' },
  },
  {
    key: 'wandb.apiKeyFile',
    label: 'API key file',
    description: 'File on the cluster containing your W&B API key, read when the job starts.',
    group: 'Weights & Biases',
    type: 'path',
    default: '~/.wandb_api_key',
    target: { kind: 'secretFile', name: 'WANDB_API_KEY' },
  },
  {
    key: WANDB_PUBLISH_LINK_KEY,
    label: 'Link in run history',
    description:
      'Shows a link to the W&B run in the public run history, which then includes the entity and project. Needs the entity and online mode.',
    group: 'Weights & Biases',
    type: 'bool',
    default: true,
    target: { kind: 'runHistory' },
  },
]

// W&B run id, fixed so that the run's link is known when the job starts (W&B picks a random
// one otherwise). Shell syntax, expanded in the job.
export const WANDB_RUN_ID = '${SLURM_CLUSTER_NAME:-unknown}-${SLURM_JOB_ID}'

// Link to the run on the W&B server, with WANDB_RUN_ID in shell syntax, or null when it isn't
// to be published or can't be known: without an entity W&B uses the API key's default entity,
// and offline runs are never uploaded
export const getWandbRunUrl = (monitoring: ResolvedMonitoring): string | null => {
  const environment = monitoring.environment
  if (
    monitoring.destination.id !== 'wandb' ||
    monitoring.runHistory[WANDB_PUBLISH_LINK_KEY] !== 'true' ||
    environment.WANDB_MODE === 'offline' ||
    !environment.WANDB_ENTITY ||
    !environment.WANDB_PROJECT
  ) {
    return null
  }
  const host = (environment.WANDB_BASE_URL || 'https://wandb.ai').replace(/\/+$/, '')
  if (!host.startsWith('https://')) return null
  return `${host}/${environment.WANDB_ENTITY}/${environment.WANDB_PROJECT}/runs/${WANDB_RUN_ID}`
}
