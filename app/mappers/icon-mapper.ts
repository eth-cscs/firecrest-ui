/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import {
  CheckCircleIcon,
  DocumentIcon,
  MinusCircleIcon,
  CommandLineIcon,
  CpuChipIcon,
  ForwardIcon
} from '@heroicons/react/24/outline'

export const serviceIconMapper = (serviceName: string) => {
  switch (serviceName) {
    
    case 'cluster':
      return CpuChipIcon
    case 'status':
      return CheckCircleIcon
    case 'filesystem':
      return DocumentIcon
    case 'compute':
      return CommandLineIcon
    case 'scheduler':
      return ForwardIcon
    default:
      return MinusCircleIcon
  }
}
