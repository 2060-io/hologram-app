export type VeranaNetwork = {
  id: string
  label: string
  indexerUrl: string
  production: boolean
  explorerUrl?: string
  ecosystemDids?: string[]
}

export const VERANA_NETWORKS: VeranaNetwork[] = [
  { id: 'vna-devnet-1', label: 'DEVNET', indexerUrl: 'https://idx.devnet.verana.network', production: false },
  { id: 'vna-testnet-1', label: 'TESTNET', indexerUrl: 'https://idx.testnet.verana.network', production: false },
]
