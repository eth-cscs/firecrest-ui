/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

// types
import type { SystemNodesHealth } from '~/types/api-status'

interface NodesHealthDataProps {
  nodes: SystemNodesHealth
}

const NodesHealthData: React.FC<NodesHealthDataProps> = ({ nodes }: NodesHealthDataProps) => {
  if (!nodes) return null
  const { available, total } = nodes
  return (
    <span>
      available {available} of {total}
    </span>
  )
}

export default NodesHealthData
