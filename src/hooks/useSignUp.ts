import { UserProfileData } from '@2060.io/credo-ts-didcomm-user-profile'
import { useCallback, useState } from 'react'
import Config from 'react-native-config'

import { useMobileAgent, useUserProfile } from '@2060/hooks/agent'
import { isRegistered } from '@2060/services/agent'
import { log, logError } from '@2060/utils'

const defaultServicePublicDid = Config.DEFAULT_SERVICE_PUBLIC_DID as string
const defaultServiceAlias = Config.DEFAULT_SERVICE_ALIAS as string
const cloudAgentPublicDid = Config.CLOUD_AGENT_PUBLIC_DID as string

export const useSignUp = () => {
  const { agent, handleChangeAgentState } = useMobileAgent()
  const { updateUserProfileData } = useUserProfile()
  const [displayName, setDisplayName] = useState('')
  const [displayPicture, setDisplayPicture] = useState<UserProfileData['displayPicture']>()

  const startSignUp = useCallback(async () => {
    if (!agent || !agent?.isInitialized) throw new Error('Agent not initialized')

    let { connectionRecord: cloudAgentConnection } = await agent.oob.receiveImplicitInvitation({
      did: cloudAgentPublicDid,
      alias: 'Cloud Agent',
      autoAcceptConnection: true,
    })
    if (!cloudAgentConnection) throw new Error('Agency connection not created')

    cloudAgentConnection = await agent.connections.returnWhenIsConnected(cloudAgentConnection.id, {
      timeoutMs: 5000,
    })

    const mediationRecord = await agent.mediationRecipient.requestAndAwaitGrant(cloudAgentConnection, 5000)
    await agent.mediationRecipient.setDefaultMediator(mediationRecord)
    await agent.mediationRecipient.initialize()
    updateUserProfileData({ displayName: displayName.trim(), displayPicture })
    const isSignedUp = await isRegistered(agent)
    handleChangeAgentState({ isSignedUp })

    try {
      let { connectionRecord: defaultServiceConnection } = await agent.oob.receiveImplicitInvitation({
        did: defaultServicePublicDid,
        alias: defaultServiceAlias,
        autoAcceptConnection: true,
      })
      if (!defaultServiceConnection) throw new Error('Default service connection not created')

      defaultServiceConnection = await agent.connections.returnWhenIsConnected(defaultServiceConnection.id, {
        timeoutMs: 5000,
      })

      log('connected with default service')
    } catch (error) {
      logError(`cannot connect to default service: ${error}`)
    }
  }, [agent, displayName, displayPicture])

  return { startSignUp, displayName, setDisplayName, displayPicture, setDisplayPicture }
}
