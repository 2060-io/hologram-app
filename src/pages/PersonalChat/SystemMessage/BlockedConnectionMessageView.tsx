import React, { useTransition } from 'react'
import { useTranslation } from 'react-i18next'

import BaseSystemMessageView from '../BaseSystemMessageView'

import { BlockedConnectionMessageProps } from './Props'

import { useMobileAgent } from '@2060/hooks/agent'
import { unblockConnection } from '@2060/utils/connectionUtils'
import { toast } from '@2060/utils/toast'

const BlockedConnectionMessageView: React.FC<BlockedConnectionMessageProps> = props => {
  const { connectionId, text } = props
  const [unlocking, startUnlockTransition] = useTransition()
  const { t } = useTranslation()
  const { agent } = useMobileAgent()

  const unblock = async () => {
    if (!connectionId || !agent) return
    startUnlockTransition(async () => {
      try {
        const connection = await agent.connections.getById(connectionId)
        await unblockConnection(agent, connection)
      } catch (error) {
        toast({ type: 'error', message: `${error}` })
      }
    })
  }

  return <BaseSystemMessageView text={unlocking ? t('connection.unblocking') : text} onPress={unblock} />
}

export default BlockedConnectionMessageView
