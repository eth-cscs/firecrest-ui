/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

// badges
import LabelBadge, { LabelColor } from './LabelBadge'

const YesNoBooleanBadge: React.FC<any> = ({ booleanValue }: any) => {
  if (booleanValue) {
    return <LabelBadge color={LabelColor.GREEN}>Yes</LabelBadge>
  }
  return <LabelBadge color={LabelColor.RED}>No</LabelBadge>
}

export default YesNoBooleanBadge
