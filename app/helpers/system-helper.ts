// types
import {
  System,
  FileSystem,
  ServiceType,
  ServiceHealth,
  SystemHealtyStatus,
} from '~/types/api-status'

const filterServicesHealthByType = (
  servicesHealth: ServiceHealth[],
  serviceType: ServiceType,
  checkIsHealthy: boolean = false,
) => {
  return servicesHealth.filter((serviceHealth: ServiceHealth) => {
    if (checkIsHealthy) {
      return serviceHealth.serviceType === serviceType && serviceHealth.healthy
    }
    return serviceHealth.serviceType === serviceType
  })
}

const isSystemHealthy = (system: System): SystemHealtyStatus => {
  const totalNumberOfServicesHealth = system.servicesHealth.length
  const healthyServicesHealth = system.servicesHealth.filter(
    (serviceHealth: ServiceHealth) => serviceHealth.healthy,
  )
  if (totalNumberOfServicesHealth === healthyServicesHealth.length) {
    return SystemHealtyStatus.healthy
  } else if (healthyServicesHealth.length === 0) {
    return SystemHealtyStatus.unhealthy
  }
  return SystemHealtyStatus.degraded
}

const isSystemHealthyByServiceType = (system: System, serviceType: ServiceType) => {
  const servicesHealth = filterServicesHealthByType(system.servicesHealth, serviceType, true)
  return servicesHealth.length > 0
}

const getHealthySchedulerSystems = (systems: System[]) => {
  if (!systems) return systems
  const healthySystems = systems.filter((system) =>
    isSystemHealthyByServiceType(system, ServiceType.scheduler),
  )
  return healthySystems
}

const getHealthyFileSystemSystems = (systems: System[]) => {
  if (!systems) return systems
  const healthySystems = systems.filter((system) =>
    isSystemHealthyByServiceType(system, ServiceType.filesystem),
  )
  return healthySystems
}

const isFileSystemHealthy = (system: System, fileSystem: FileSystem) => {
  const servicesHealth = filterServicesHealthByType(
    system.servicesHealth,
    ServiceType.filesystem,
    true,
  )
  if (!servicesHealth || servicesHealth === null || servicesHealth.length <= 0) {
    return false
  }
  return servicesHealth.find((servicesHealth: ServiceHealth) => {
    return servicesHealth.path === fileSystem.path
  })
}

export {
  isSystemHealthy,
  isSystemHealthyByServiceType,
  getHealthySchedulerSystems,
  getHealthyFileSystemSystems,
  isFileSystemHealthy,
}
