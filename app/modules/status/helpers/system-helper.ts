import _ from 'lodash'
// types
import { FileSystemDataType, FileSystem, System } from '~/types/api-status'

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
  if (system.fileSystems.length == 0){
    return null
  }
  const fileSystem = system.fileSystems.find((fileSystem: FileSystem) => {
    return fileSystem.defaultWorkDir == true
  })
  if (fileSystem === null){
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
