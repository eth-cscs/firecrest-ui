/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { isFileSystemHealthy } from '~/helpers/system-helper'
import { getDefaultFileSystemFromSystem } from '~/modules/status/helpers/system-helper'
import { FileSystemDataType } from '~/types/api-status'
import type { FileSystem, System } from '~/types/api-status'

const isUnderPath = (path: string, parent: string) => {
  const normalizedParent = parent.replace(/\/+$/, '')
  return path === normalizedParent || path.startsWith(`${normalizedParent}/`)
}

// Training writes checkpoints and logs into the working directory, so it defaults to the user's
// directory on scratch rather than the system's default filesystem, which is often home
export const getDefaultTrainingWorkingDirectory = (system: System | null, username: string) => {
  if (!system) return ''
  const scratchFileSystems = system.fileSystems.filter(
    (fileSystem: FileSystem) => fileSystem.dataType === FileSystemDataType.scratch,
  )
  const fileSystem =
    scratchFileSystems.find((f: FileSystem) => isFileSystemHealthy(system, f)) ??
    scratchFileSystems[0] ??
    getDefaultFileSystemFromSystem(system)
  return fileSystem ? `${fileSystem.path.replace(/\/+$/, '')}/${username}` : ''
}

// Home has a small quota and the NeMo-RL blueprint refuses to write its runs there
export const isOnHomeFileSystem = (system: System | null, path: string) => {
  return (system?.fileSystems ?? []).some(
    (fileSystem: FileSystem) =>
      fileSystem.dataType === FileSystemDataType.users && isUnderPath(path.trim(), fileSystem.path),
  )
}
