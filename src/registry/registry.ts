import { ICNS, serviceID as _icnsID } from './icns'
import { IBCDomains, serviceID as _ibcDomainsID } from './ibc-domains'
import { StargazeNames, serviceID as _stargazeNamesID } from './stargaze-names'
import { ArchIdNames, serviceID as _archId } from './arch-id'
import {
  MatchaError,
  MatchaErrorType,
  NameService,
  Network
} from './name-service'

export const services = {
  icns: _icnsID,
  ibcDomains: _ibcDomainsID,
  stargazeNames: _stargazeNamesID,
  archIds: _archId
}

export class Registry {
  private services: { [key: string]: NameService } = {}

  constructor(private network: Network) {
    this.network = network
    this.registerService(new ICNS())
    this.registerService(new IBCDomains())
    this.registerService(new StargazeNames())
    this.registerService(new ArchIdNames())
  }

  registerService(service: NameService) {
    if (this.services[service.serviceID]) {
      throw new MatchaError(
        'Service already registered',
        MatchaErrorType.DUPLICATE_SERVICE
      )
    }
    this.services[service.serviceID] = service
  }

  private getService(serviceID: string): NameService {
    const service = this.services[serviceID]
    if (!service) {
      throw new MatchaError(
        'Service not registered',
        MatchaErrorType.UNREGISTERED_SERVICE
      )
    }
    return service
  }

  listServices(): string[] {
    return Object.keys(this.services)
  }

  setNetwork(network: Network) {
    this.network = network
  }

  getNetwork(): Network {
    return this.network
  }

  async resolve(name: string, serviceID: string): Promise<string> {
    const service = this.getService(serviceID)
    return service.resolve(name, this.network)
  }

  async lookup(address: string, serviceID: string): Promise<string> {
    const service = this.getService(serviceID)
    return service.lookup(address, this.network)
  }

  async resolveAll(name: string) {
    const record: Record<string, string | null> = {}
    await Promise.all(
      Object.entries(this.services).map(async ([serviceID, service]) => {
        try {
          const result = await service.resolve(name, this.network)
          record[serviceID] = result
        } catch (e) {
          record[serviceID] = null
        }
      })
    )
    return record
  }

  async lookupAll(address: string) {
    const record: Record<string, string | null> = {}
    await Promise.all(
      Object.entries(this.services).map(async ([serviceID, service]) => {
        try {
          const result = await service.lookup(address, this.network)
          record[serviceID] = result
        } catch (e) {
          record[serviceID] = null
        }
      })
    )
    return record
  }
}
