import { ConnectionRecord } from '@credo-ts/core'

export const ActionIconsNames = { text: 'chat', audio: 'phoneUp', video: 'video' }

export type ActionProps = {
  value: 'text' | 'video' | 'audio'
  onPress: () => void
}

export type ConnectionMainActionsProps = {
  defaultActions?: ActionProps[]
  connection: ConnectionRecord
  iconColor: string
}
