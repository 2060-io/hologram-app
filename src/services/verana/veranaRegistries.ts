import { VerifiablePublicRegistry } from '@verana-labs/verre'
import Config from 'react-native-config'

// Every cast we ship against today is testnet, so an unset flag must not claim production trust.
export const isVeranaTestnet = Config.VERANA_TESTNET !== 'false'

export const veranaRegistries: VerifiablePublicRegistry[] = [
  {
    id: 'vpr:verana:vna-testnet-1',
    baseUrls: ['https://idx.testnet.verana.network/verana'],
    production: !isVeranaTestnet,
  },
  {
    id: 'vpr:verana:vna-devnet-1',
    baseUrls: ['https://idx.devnet.verana.network/verana'],
    production: !isVeranaTestnet,
  },
]

export function registryBaseUrlFor(registryId: string): string | undefined {
  return veranaRegistries.find((registry) => registryId.startsWith(registry.id))?.baseUrls[0]
}

export const VERANA_EXPLORER_URL = 'https://app.testnet.verana.network'
