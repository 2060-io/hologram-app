import { DidCommUserProfileData } from '@2060.io/credo-ts-didcomm-user-profile'
import { CommonActions, useNavigation } from '@react-navigation/native'
import { useCallback, useState } from 'react'
import Config from 'react-native-config'

import { updateThreadFromServiceInfo } from './agent/chat/services'

import { useMobileAgent, useUserProfile } from '@src/hooks/agent'
import RealmSingleton from '@src/services/RealmSingleton'
import { isRegistered } from '@src/services/agent'
import { saveInCacheServiceInfo } from '@src/services/agent/cache'
import { getServiceInfo } from '@src/services/trustResolution'
import { log, logError } from '@src/utils'
import { useConfig } from './providers/ConfigProvider'

const defaultServicePublicDid = Config.DEFAULT_SERVICE_PUBLIC_DID as string
const defaultServiceAlias = Config.DEFAULT_SERVICE_ALIAS as string

export const useSignUp = () => {
  const navigation = useNavigation()
  const { agent, handleChangeAgentState } = useMobileAgent()
  const { updateUserProfileData } = useUserProfile()
  const [displayName, setDisplayName] = useState('')
  const [displayPicture, setDisplayPicture] = useState<DidCommUserProfileData['displayPicture']>()

  const { devEnvs } = useConfig()

  const startSignUp = useCallback(async () => {
    if (!agent || !agent?.isInitialized) throw new Error('Agent not initialized')

    const cloudAgentPublicDid = devEnvs.CLOUD_AGENT_PUBLIC_DID as string

    let { connectionRecord: cloudAgentConnection } = await agent.didcomm.oob.receiveImplicitInvitation({
      label: Config.APP_NAME || 'Hologram',
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
  }, [agent, displayName, displayPicture])

  const tryToConnectToDefaultService = useCallback(async () => {
    if (!agent) return
    try {
      let { connectionRecord: defaultServiceConnection } = await agent.didcomm.oob.receiveImplicitInvitation({
        label: Config.APP_NAME || 'Hologram',
        did: defaultServicePublicDid,
        alias: defaultServiceAlias,
        autoAcceptConnection: true,
      })
      if (!defaultServiceConnection) throw new Error('Default service connection not created')

      defaultServiceConnection = await agent.didcomm.connections.returnWhenIsConnected(
        defaultServiceConnection.id,
        { timeoutMs: 5000 },
      )
      log(`connected with default service ${defaultServicePublicDid}`)
      return true
    } catch (error) {
      logError(`Could not connect to default service: ${defaultServicePublicDid}`, error)
      return false
    }
  }, [agent])

  const fetchDefaultConnectedServiceInfo = useCallback(async () => {
    if (!agent) return
    try {
      const did = defaultServicePublicDid
      const serviceInfoResponse = await getServiceInfo({ agent, did })
      if (serviceInfoResponse) {
        await saveInCacheServiceInfo(did, agent, serviceInfoResponse)
        const realmInstance = RealmSingleton.instance
        const realm = realmInstance.getRealm()
        if (realm) updateThreadFromServiceInfo({ did, serviceInfoResponse, realm, agent })
      }
    } catch (error) {
      logError(`Error getting service info after connect with ${defaultServicePublicDid} info API`, error)
    }
  }, [agent])

  return {
    startSignUp,
    tryToConnectToDefaultService,
    fetchDefaultConnectedServiceInfo,
    displayName,
    setDisplayName,
    displayPicture,
    setDisplayPicture,
  }
}
