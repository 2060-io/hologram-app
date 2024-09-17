import React from 'react'

import BaseSystemMessageView from '../BaseSystemMessageView'
import SecuritySystemMessageView from '../SecuritySystemMessageView'

import BlockedConnectionMessageView from './BlockedConnectionMessageView'
import { SystemMessageProps } from './Props'

import { useChat, useConnectionById } from '@2060/hooks/agent'

const SystemMessage: React.FC<SystemMessageProps> = props => {
  const { chatThread } = useChat()
  const connection = useConnectionById(chatThread?.data.connectionId)

  if (props.kind === 'blocked') {
    return <BlockedConnectionMessageView connectionId={connection?.id} kind={props.kind} text={props.text} />
  }

  if (props.kind === 'security') {
    return <SecuritySystemMessageView connection={connection} />
  }

  return <BaseSystemMessageView text={props.text} />
}

export default SystemMessage
