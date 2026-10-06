export type VeranaNetwork = {
  id: string
  label: string
  indexerUrl: string
  production: boolean
  ecosystemDids?: string[]
}

export const VERANA_NETWORKS: VeranaNetwork[] = [
  { id: 'vna-devnet-1', label: 'DEVNET', indexerUrl: 'https://idx.devnet.verana.network', production: false },
]
