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
      'Shows a link to the W&B run in the public run history, which then includes the entity and project. Without an entity, the job looks up the default entity of your API key. Needs online mode.',
    group: 'Weights & Biases',
    type: 'bool',
    default: true,
    target: { kind: 'runHistory' },
  },
]

// W&B run id, fixed so that the run's link is known when the job starts (W&B picks a random
// one otherwise). Shell syntax, expanded in the job.
export const WANDB_RUN_ID = '${SLURM_CLUSTER_NAME:-unknown}-${SLURM_JOB_ID}'

// Set by the job to the API key's default entity, which W&B uses when no entity is chosen
// (see getWandbEntityLookup). Shell syntax, expanded in the job.
export const WANDB_LINK_ENTITY = '${WANDB_LINK_ENTITY}'

// Link to the run on the W&B server, in shell syntax for what only the job knows, or null when
// it isn't to be published or can't be known: offline runs are never uploaded
export const getWandbRunUrl = (monitoring: ResolvedMonitoring): string | null => {
  const environment = monitoring.environment
  if (
    monitoring.destination.id !== 'wandb' ||
    monitoring.runHistory[WANDB_PUBLISH_LINK_KEY] !== 'true' ||
    environment.WANDB_MODE === 'offline' ||
    !environment.WANDB_PROJECT
  ) {
    return null
  }
  const host = (environment.WANDB_BASE_URL || 'https://wandb.ai').replace(/\/+$/, '')
  if (!host.startsWith('https://')) return null
  const entity = environment.WANDB_ENTITY || WANDB_LINK_ENTITY
  return `${host}/${entity}/${environment.WANDB_PROJECT}/runs/${WANDB_RUN_ID}`
}

// Script lines that set WANDB_LINK_ENTITY when the link needs it. The API key is read from its
// file and given to curl on stdin, never as an argument, which other users could see; only an
// entity made of safe characters is kept. If the lookup fails it stays empty, and the collector
// drops the link, which is then malformed.
export const getWandbEntityLookup = (monitoring: ResolvedMonitoring): string[] => {
  const keyFile = monitoring.secretFiles.WANDB_API_KEY
  if (!getWandbRunUrl(monitoring) || monitoring.environment.WANDB_ENTITY || !keyFile) return []
  // The cloud API is on its own host; self-hosted servers serve it next to the web app
  const apiUrl = (monitoring.environment.WANDB_BASE_URL || 'https://api.wandb.ai').replace(
    /\/+$/,
    '',
  )
  return [
    "# W&B entity for the run's link: no entity was chosen, so W&B uses the API key's default one",
    `WANDB_LINK_ENTITY="$(printf 'user = "api:%s"\\n' "$(cat "${keyFile}" 2>/dev/null)" | curl -sf --max-time 20 -K - -H 'Content-Type: application/json' -d '{"query":"query { viewer { entity } }"}' "${apiUrl}/graphql" | sed -n 's/.*"entity": *"\\([A-Za-z0-9._-]\\{1,128\\}\\)".*/\\1/p')" || WANDB_LINK_ENTITY=""`,
  ]
}
