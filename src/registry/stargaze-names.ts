import { decode, encode } from 'bech32'
import {
  Addr,
  AllowedTopLevelDomains,
  MatchaError,
  MatchaErrorType,
  NameService,
  Network
} from './name-service'

const rpcUrls = {
  mainnet: 'https://rpc.cosmos.directory/stargaze',
  testnet: 'https://rpc.elgafar-1.stargaze-apis.com'
}

export const serviceID = 'stargazeNames'

export class StargazeNames extends NameService {
  serviceID = serviceID
  chain = 'stargaze'
  contractAddress = {
    mainnet: 'stars1fx74nkqkw2748av8j7ew7r3xt9cgjqduwn8m0ur5lhe49uhlsasszc5fhr',
    testnet: 'stars1rp5ttjvd5g0vlpltrkyvq62tcrdz949gjtpah000ynh4n2laz52qarz2z8'
  }

  async resolve(
    name: string,
    network: Network,
    allowedTopLevelDomains?: AllowedTopLevelDomains
  ): Promise<string> {
    const client = await this.getCosmWasmClient(rpcUrls[network])
    const [username, prefix] = name.split('.')
    try {
      const res = await client.queryContractSmart(
        this.contractAddress[network],
        {
          associated_address: {
            name: username
          }
        }
      )

      if (
        !res ||
        allowedTopLevelDomains?.stargazeNames?.indexOf(prefix) === -1
      ) {
        throw new MatchaError('', MatchaErrorType.NOT_FOUND)
      }
      try {
        const { words } = decode(res)
        return encode(prefix, words)
      } catch {
        throw new MatchaError('', MatchaErrorType.NOT_FOUND)
      }
    } catch (e) {
      throw new MatchaError('', MatchaErrorType.NOT_FOUND)
    }
  }

  async lookup(address: string, network: Network): Promise<string> {
    const client = await this.getCosmWasmClient(rpcUrls[network])
    const addr: Addr = {
      prefix: null,
      words: null
    }
    try {
      const { prefix, words } = decode(address)
      addr.prefix = prefix
      addr.words = words
    } catch (e) {
      throw new MatchaError('', MatchaErrorType.INVALID_ADDRESS)
    }
    try {
      const res = await client.queryContractSmart(
        this.contractAddress[network],
        {
          name: {
            address
          }
        }
      )
      return `${res}.${addr.prefix}`
    } catch (e) {
      throw new MatchaError('', MatchaErrorType.NOT_FOUND)
    }
  }
}
