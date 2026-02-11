import { ServiceStatus } from '@src/model'

export type ConnectionsBySections = {
  title: string
  connections: ConnectionItem[]
}

export type ConnectionItem = {
  id: string
  avatarUrl: string
  name: string
  isService: boolean
  invitationDid?: string
  subConnections: ConnectionItem[]
  subConnectionsThatMatchWithSearch?: number
  status?: ServiceStatus
}

export type Props = {
  onPress(connectionItem: ConnectionItem): void
  onPressRightSide(connectionItem: ConnectionItem): void
  connectionsBySections: ConnectionsBySections[]
  isSearchingMode: boolean
  selectedConnections?: string[]
}
