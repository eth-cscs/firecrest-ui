/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import React from 'react'
// views
import SimpleView, { SimpleViewSize } from '~/components/views/SimpleView'

const SFTView: React.FC = () => {
  return <SimpleView title='Supervised Fine-Tuning (SFT)' size={SimpleViewSize.FULL} />
}

export default SFTView
