/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import {
  CheckCircleIcon,
  CpuChipIcon,
  DocumentIcon,
  MinusCircleIcon,
} from '@heroicons/react/24/outline'

export const serviceIconMapper = (serviceName: string) => {
  switch (serviceName) {
    case 'status':
      return CheckCircleIcon
    case 'filesystem':
      return DocumentIcon
    case 'compute':
      return CpuChipIcon
    default:
      return MinusCircleIcon
  }
}
