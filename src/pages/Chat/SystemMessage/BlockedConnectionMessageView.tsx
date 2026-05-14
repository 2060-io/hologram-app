import { useMobileAgent } from '@src/hooks/agent'
import { unblockConnection } from '@src/utils/connectionUtils'
import { toast } from '@src/utils/toast'
import React, { useTransition } from 'react'
import { useTranslation } from 'react-i18next'
import BaseSystemMessageView from '../BaseSystemMessageView'
import { BlockedConnectionMessageProps } from './Props'

const BlockedConnectionMessageView: React.FC<BlockedConnectionMessageProps> = (props) => {
  const { connectionId, text } = props
  const [unlocking, startUnlockTransition] = useTransition()
  const { t } = useTranslation()
  const { agent } = useMobileAgent()

  const unblock = async () => {
    if (!connectionId || !agent) return
    startUnlockTransition(async () => {
      try {
        const connection = await agent.didcomm.connections.getById(connectionId)
        await unblockConnection(agent, connection)
      } catch (error) {
        toast({ type: 'error', message: `${error}` })
      }
    })
  }

  return <BaseSystemMessageView text={unlocking ? t('connection.unblocking') : text} onPress={unblock} />
}

export default BlockedConnectionMessageView
