import { useCallback, useState } from 'react'
import { Platform } from 'react-native'

import { useMobileAgent } from '../hooks/agent'

import { isRegistered } from '@2060/services/agent'
import { log, logError } from '@2060/utils'
import { getFcmDeviceToken } from '@2060/utils/pushNotificationsUtils'

export enum SignUpState {
  Init = 'Init',
  Started = 'Started',
  Connected = 'Connected',
  AgentCreated = 'AgentCreated',
}

interface SignUpOptions {
  cloudAgentPublicDid: string
  defaultServicePublicDid: string
  defaultServiceAlias: string
}

export const useSignUp = (options: SignUpOptions) => {
  const { agent, handleChangeAgentState } = useMobileAgent()

  const [signUpState, setSignUpState] = useState<SignUpState>(SignUpState.Init)

  const updateNotificationInfo = useCallback(async () => {
    if (!agent) return

    const connection = await agent.mediationRecipient.findDefaultMediatorConnection()
    if (!connection) return

    const deviceToken = await getFcmDeviceToken()
    await agent.modules.pushNotifications.setDeviceInfo(connection.id, {
      deviceToken,
      devicePlatform: Platform.OS,
    })
  }, [agent])

  const startSignUp = useCallback(async () => {
    if (!agent || !agent?.isInitialized) throw new Error('Agent not initialized')

    setSignUpState(SignUpState.Started)

    let { connectionRecord: cloudAgentConnection } = await agent.oob.receiveImplicitInvitation({
      did: options.cloudAgentPublicDid,
      alias: 'Cloud Agent',
      autoAcceptConnection: true,
    })
    if (!cloudAgentConnection) throw new Error('Agency connection not created')

    cloudAgentConnection = await agent.connections.returnWhenIsConnected(cloudAgentConnection.id, {
      timeoutMs: 5000,
    })

    setSignUpState(SignUpState.Connected)

    const mediationRecord = await agent.mediationRecipient.requestAndAwaitGrant(cloudAgentConnection, 5000)
    await agent.mediationRecipient.setDefaultMediator(mediationRecord)
    await agent.mediationRecipient.initialize()
    setSignUpState(SignUpState.AgentCreated)
    const isSignedUp = await isRegistered(agent)
    handleChangeAgentState({ isSignedUp })

    try {
      let { connectionRecord: defaultServiceConnection } = await agent.oob.receiveImplicitInvitation({
        did: options.defaultServicePublicDid,
        alias: options.defaultServiceAlias,
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
  }, [agent])

  return { signUpState, startSignUp, updateNotificationInfo }
}
