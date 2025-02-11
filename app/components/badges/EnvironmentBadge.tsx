/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

// types
import { Environment } from '~/types/base'
// badges
import LabelBadge, { LabelColor } from './LabelBadge'

const EnvironmentBadge: React.FC<any> = ({ environment, className = '' }: any) => {
  switch (environment) {
    case Environment.development:
      return (
        <LabelBadge color={LabelColor.GREEN} className={className}>
          {environment}
        </LabelBadge>
      )
    case Environment.testing:
      return (
        <LabelBadge color={LabelColor.YELLOW} className={className}>
          {environment}
        </LabelBadge>
      )
    case Environment.staging:
      return (
        <LabelBadge color={LabelColor.BLUE} className={className}>
          {environment}
        </LabelBadge>
      )
    default:
      break
  }
  return null
}

export default EnvironmentBadge
