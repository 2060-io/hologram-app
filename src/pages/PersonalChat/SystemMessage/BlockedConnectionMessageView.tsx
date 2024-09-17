import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

import BaseSystemMessageView from '../BaseSystemMessageView'

import { BlockedConnectionMessageProps } from './Props'

import { useMobileAgent } from '@2060/hooks/agent'
import { unblockConnection } from '@2060/hooks/agent/connections'
import { toast } from '@2060/utils/toast'

const BlockedConnectionMessageView: React.FC<BlockedConnectionMessageProps> = props => {
  const { connectionId, text } = props
  const [unlocking, setUnlocking] = useState(false)
  const { t } = useTranslation()
  const { agent } = useMobileAgent()

  const handleUnblockConnection = async () => {
    if (!connectionId || !agent) return
    setUnlocking(true)
    try {
      const connection = await agent.connections.getById(connectionId)
      await unblockConnection(agent, connection)
    } catch (error) {
      toast({ type: 'error', message: `${error}` })
    } finally {
      setUnlocking(false)
    }
  }

  return (
    <BaseSystemMessageView
      text={unlocking ? t('connection.unblocking') : text}
      onPress={handleUnblockConnection}
    />
  )
}

export default BlockedConnectionMessageView
