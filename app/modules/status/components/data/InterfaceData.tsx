/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import _ from 'lodash'
import LabelBadge, { LabelColor } from '~/components/badges/LabelBadge'
// types
import type { Scheduler } from '~/types/api-status'

interface InterfaceDataProps {
  scheduler: Scheduler
}

const InterfaceData: React.FC<InterfaceDataProps> = ({ scheduler }: InterfaceDataProps) => {
  const { type, version, apiUrl } = scheduler
  if (apiUrl && !_.isEmpty(apiUrl)) {
    return (
      <>
        <LabelBadge color={LabelColor.ORANGE}>SSH</LabelBadge>
        <LabelBadge color={LabelColor.ORANGE} className='ml-1'>
          REST APIs
        </LabelBadge>
      </>
    )
  }
  return <LabelBadge color={LabelColor.ORANGE}>SSH</LabelBadge>
}

export default InterfaceData
