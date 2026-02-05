import { DidCommConnectionRecord } from '@credo-ts/didcomm'
import { ParamListBase } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'

export const ActionIconsNames = { text: 'chat', audio: 'phoneUp', video: 'video' }

export type ActionProps = {
  value: 'text' | 'video' | 'audio'
  onPress: () => void
}

export type InitialConnectionMainActionsProps = {
  includeDefaultActions: boolean
  navigation: StackNavigationProp<ParamListBase>
  connectionId: string
}

export type ConnectionMainActionsProps = InitialConnectionMainActionsProps & {
  connection: DidCommConnectionRecord
}
