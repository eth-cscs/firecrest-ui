/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import _ from 'lodash'
// types
import { FileSystemDataType, FileSystem, System } from '~/types/api-status'

type ResolvedFileSystem = {
  fileSystem: FileSystem
  path: string
}

export const getFileSystemByTargetPath = (
  system: System,
  targetPath: string | null | undefined,
  username: string,
): ResolvedFileSystem => {
  if (!system) {
    throw new Error('Filesystem(s) configuration error: system is missing')
  }

  // If no target path, resolve from default
  if (targetPath == null || _.isEmpty(targetPath)) {
    const fileSystem = getDefaultFileSystemFromSystem(system)

    if (!fileSystem) {
      throw new Error('Filesystem(s) configuration error: no default filesystem')
    }

    let path = fileSystem.path

    if (fileSystem.defaultWorkDir) {
      path = `${fileSystem.path}/${username}`
    }

    return { fileSystem, path }
  }

  // If target path is provided, search in the system
  const fileSystem = searchFileSystemByPath(system.fileSystems, targetPath, false)

  if (!fileSystem) {
    throw new Error(`Filesystem(s) configuration error: no filesystem for path "${targetPath}"`)
  }

  return { fileSystem, path: targetPath }
}

export const searchSystemByName = (systems: System[], name: string, defaultValue: any = null) => {
  const system = systems.find((system: System) => {
    return system.name == name
  })
  return system || defaultValue
}

export const searchFileSystemByPath = (
  fileSystems: FileSystem[],
  path: string,
  strict: boolean = true,
  defaultValue: any = null,
) => {
  const fileSystem = fileSystems.find((fileSystem: FileSystem) => {
    if (strict) {
      return fileSystem.path === path
    }
    return path.startsWith(fileSystem.path)
  })
  return fileSystem || defaultValue
}

export const getDefaultSystemFromSystems = (systems: System[]) => {
  if (!systems || systems.length <= 0) {
    return null
  }
  const filteredSystems = systems.filter((system: System) => {
    const fileSystem = getDefaultFileSystemFromSystem(system)
    return fileSystem !== null
  })
  return !_.isEmpty(filteredSystems) ? filteredSystems[0] : systems[0]
}

export const getDefaultFileSystemFromSystem = (system: System | null) => {
  if (system === null) {
    return null
  }
  if (system.fileSystems.length == 0) {
    return null
  }
  const fileSystem = system.fileSystems.find((fileSystem: FileSystem) => {
    return fileSystem.defaultWorkDir == true
  })
  if (fileSystem === null) {
    return system.fileSystems[0]
  }
  return fileSystem
}

export const getDefaultFileSystemFromSystems = (systems: System[]) => {
  const system = getDefaultSystemFromSystems(systems)
  if (system === null) {
    return null
  }
  return getDefaultFileSystemFromSystem(system)
}
