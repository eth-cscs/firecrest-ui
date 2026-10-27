/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import env from './env'
import { getEnvVariable } from '~/helpers/env-helper'

const aiTraining = {
  // Where the published RL run history is read from: <url>/<recipe id>/index.json. Defaults to
  // the rl-runs branch the run collector writes to.
  rlRunsUrl: getEnvVariable(
    env,
    'AI_TRAINING_RL_RUNS_URL',
    false,
    'https://raw.githubusercontent.com/eth-cscs/alps-extended-images/rl-runs',
  ),
  // Where the NeMo-RL blueprints are read from: Alps-Images/apps/nemo-rl/blueprints/index.json of
  // a GitHub repository, at a full commit id. Jobs check out the blueprint example at the same
  // commit, which is recorded with each run as the recipe version.
  nemoRlBlueprintsRepository: getEnvVariable(
    env,
    'AI_TRAINING_NEMO_RL_BLUEPRINTS_REPOSITORY',
    false,
    'eth-cscs/alps-extended-images',
  ),
  // The nemo-rl-blueprints branch until it is merged
  nemoRlBlueprintsCommit: getEnvVariable(
    env,
    'AI_TRAINING_NEMO_RL_BLUEPRINTS_COMMIT',
    false,
    'b956397f30e3639754e359c2eebcffa7671303b7',
  ),
}

export default aiTraining
