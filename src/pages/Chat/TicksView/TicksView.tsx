import { MessageStateIcon } from '@src/components/common'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { ChatEntryRole, ChatEntryState } from '@src/model'
import React from 'react'

type Props = {
  role: ChatEntryRole
  state: ChatEntryState
}

const TicksView: React.FC<Props> = ({ role, state }) => {
  const theme = useTheme()
  if (role === ChatEntryRole.Receiver) return null

  return <MessageStateIcon theme={theme} state={state} />
}

export default TicksView
