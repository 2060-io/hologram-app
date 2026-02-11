import React from 'react'

import { MessageStateIcon } from '@2060/components/common'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { ChatEntryRole, ChatEntryState } from '@2060/model'

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
