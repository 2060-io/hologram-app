import { ServiceStatus } from '@2060/model'

export type ConnectionListSection = {
  title: string
  connections: ConnectionItem[]
}

export type ConnectionItem = {
  id: string
  avatarUrl: string
  name: string
  isService: boolean
  subConnections: ConnectionItem[]
  subConnectionsThatMatchWithSearch?: number
  status?: ServiceStatus
}

export type Props = {
  onPress(connectionItem: ConnectionItem): void
  onPressRightSide(connectionItem: ConnectionItem): void
  connectionList: ConnectionListSection[]
  isSearchingMode: boolean
  allowSelection: boolean
  selectedConnections?: string[]
}
