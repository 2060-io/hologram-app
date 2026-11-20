import { MessageStateIcon } from '@src/components/common'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { ChatEntryRole, ChatEntryState } from '@src/model'
import React from 'react'
import { View } from 'react-native'

type Props = {
  role: ChatEntryRole
  state: ChatEntryState
}

const TicksView: React.FC<Props> = ({ role, state }) => {
  const theme = useTheme()
  if (role === ChatEntryRole.Receiver) return null

  return (
    <View testID={`message-state-${state}`}>
      <MessageStateIcon theme={theme} state={state} />
    </View>
  )
}

export default TicksView
