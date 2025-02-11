/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import _ from 'lodash'
// types
import { FileSystemDataType } from '~/types/api-status'
import type { System, FileSystem } from '~/types/api-status'


export const splitFileSystemSelection = (fileSystemSelection: string) => {
  const [systemName, fileSystemPath] = fileSystemSelection.split('#')
  return {
    systemName: systemName,
    fileSystemPath: fileSystemPath,
  }
}

export const buildFileSystemSelection = (
  system: System,
  fileSystem: FileSystem,
  username: string,
) => {
  return `${system.name}#${buildFileSystemSelectionPath(fileSystem, username)}`
}

export const buildFileSystemSelectionPath = (fileSystem: FileSystem, username: string) => {
  if (fileSystem.defaultWorkDir) {
    return `${fileSystem.path}/${username}`
  }
  return fileSystem.path
}

export const buildFileSystemNavigationPath = (
  systemName: string,
  currentPath: string,
  additionalPath: string | null = null,
) => {
  if (additionalPath === null || _.isEmpty(additionalPath)) {
    return `/filesystems/${systemName}/?targetPath=${currentPath}`
  }
  return `/filesystems/${systemName}/?targetPath=${currentPath}/${additionalPath}`
}

export const buildBreadcrumbNavigation = (
  currentPath: string,
  fileSystemPath: string,
  systemName: string,
) => {
  if (!currentPath || currentPath.trim() === '') {
    return []
  }
  const navigationStructure: any = []
  const pathSegments = currentPath.trim().split('/')
  let path = ''
  pathSegments.forEach((pathSegment: string) => {
    path = path === '/' ? `${path}${pathSegment}` : `${path}/${pathSegment}`
    navigationStructure.push({
      dirName: pathSegment,
      path: path,
      isBasePath: path === fileSystemPath,
      navUrl: buildFileSystemNavigationPath(systemName, path),
    })
  })
  return navigationStructure
}
