import { UserProfileData } from '@2060.io/credo-ts-didcomm-user-profile'
import { CommonActions, useNavigation } from '@react-navigation/native'
import { useCallback, useState } from 'react'
import Config from 'react-native-config'

import { useMobileAgent, useUserProfile } from '@2060/hooks/agent'
import { isRegistered } from '@2060/services/agent'
import { log, logError } from '@2060/utils'

const defaultServicePublicDid = Config.DEFAULT_SERVICE_PUBLIC_DID as string
const defaultServiceAlias = Config.DEFAULT_SERVICE_ALIAS as string
const cloudAgentPublicDid = Config.CLOUD_AGENT_PUBLIC_DID as string

export const useSignUp = () => {
  const navigation = useNavigation()
  const { agent, handleChangeAgentState } = useMobileAgent()
  const { updateUserProfileData } = useUserProfile()
  const [displayName, setDisplayName] = useState('')
  const [displayPicture, setDisplayPicture] = useState<UserProfileData['displayPicture']>()

  const startSignUp = useCallback(async () => {
    if (!agent || !agent?.isInitialized) throw new Error('Agent not initialized')

    let { connectionRecord: cloudAgentConnection } = await agent.didcomm.oob.receiveImplicitInvitation({
      label: 'Hologram',
      did: cloudAgentPublicDid,
      alias: 'Cloud Agent',
      autoAcceptConnection: true,
    })
    if (!cloudAgentConnection) throw new Error('Agency connection not created')

    cloudAgentConnection = await agent.didcomm.connections.returnWhenIsConnected(cloudAgentConnection.id, {
      timeoutMs: 5000,
    })

    const mediationRecord = await agent.didcomm.mediationRecipient.requestAndAwaitGrant(
      cloudAgentConnection,
      5000,
    )
    await agent.didcomm.mediationRecipient.setDefaultMediator(mediationRecord)
    await agent.didcomm.mediationRecipient.initiateMessagePickup()
    updateUserProfileData({ displayName: displayName.trim(), displayPicture })
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Home' }] }))
    const isSignedUp = await isRegistered(agent)
    handleChangeAgentState({ isSignedUp })

    try {
      let { connectionRecord: defaultServiceConnection } = await agent.didcomm.oob.receiveImplicitInvitation({
        label: 'Hologram',
        did: defaultServicePublicDid,
        alias: defaultServiceAlias,
        autoAcceptConnection: true,
      })
      if (!defaultServiceConnection) throw new Error('Default service connection not created')

      defaultServiceConnection = await agent.didcomm.connections.returnWhenIsConnected(
        defaultServiceConnection.id,
        {
          timeoutMs: 5000,
        },
      )

      log('connected with default service')
    } catch (error) {
      logError(`Could not connect to default service: ${defaultServicePublicDid}`, error)
    }
  }, [agent, displayName, displayPicture])

  return { startSignUp, displayName, setDisplayName, displayPicture, setDisplayPicture }
}
