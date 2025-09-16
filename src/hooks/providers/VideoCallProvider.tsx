import {
  CallAcceptMessage,
  CallEndMessage,
  CallRejectMessage,
  DidCommCallType,
} from '@2060.io/credo-ts-didcomm-calls'
import { AgentEventTypes, AgentMessageProcessedEvent } from '@credo-ts/core'
import React, { PropsWithChildren, useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import InCallManager from 'react-native-incall-manager'

import { useChats, useMobileAgent } from '../agent'
import { useNetwork } from '../useNetwork'

import { useLocalRealm } from './RealmProvider'
import {
  VideoCallContext,
  StateProps,
  StartCallPros,
  ConnectionStatus,
  CallStatus,
  CallInfo,
} from './useVideoCallContext'

import { VideoCall, IncomingCall } from '@2060/components'
import { Modal } from '@2060/components/common'
import { handleCameraPermission, handleMicrophonePermission } from '@2060/utils/permissions'
import { toast } from '@2060/utils/toast'

const stateInitialValues: StateProps = {
  isCameraOn: false,
  isInCall: false,
  isIncomingCall: false,
  isVideoCall: false,
  isRejected: undefined,
  incomingCallInfo: undefined,
  didcommThreadId: undefined,
  didcommConnection: undefined,
  didcommCallType: undefined,
  isFinishedCall: false,
}

const connectionStatusInitialValues = { status: CallStatus.Connecting, statusMessage: 'Connecting' }

export const VideoCallProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { t } = useTranslation()
  const [connectionStatus, updateCallStatus] = useState<ConnectionStatus>(connectionStatusInitialValues)
  const [state, setState] = useState<StateProps>(stateInitialValues)
  const stateRef = useRef<StateProps>(stateInitialValues)
  const remotePeerClosedTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const { isCameraOn, isInCall, isIncomingCall, didcommConnection, didcommCallType } = state
  const { agent } = useMobileAgent()
  const { realm } = useLocalRealm()
  const { activeChatThreadId } = useChats()
  const { assertConnectedNetwork } = useNetwork()
  const isNetworkConnected = assertConnectedNetwork()
  const isNetworkConnectedRef = useRef<boolean>(isNetworkConnected)

  useEffect(() => {
    isNetworkConnectedRef.current = isNetworkConnected
  }, [isNetworkConnected])

  const updateState = (newStateValues: Partial<StateProps>) => {
    setState(prevState => ({ ...prevState, ...newStateValues }))
    stateRef.current = { ...stateRef.current, ...newStateValues }
  }

  const handleCamera = async (callBack?: (isCameraOn: boolean) => void) => {
    const cameraPermission = await handleCameraPermission()
    if (!cameraPermission) return
    const newIsCameraOn = !isCameraOn
    updateState({ isCameraOn: newIsCameraOn })
    callBack?.(newIsCameraOn)
  }

  const stopRingtone = () => InCallManager.stopRingtone()

  /*
  const startIncomingCall = (
    connection: ConnectionRecord,
    callType: DidCommCallType,
    incomingCallInfo: CallInfo,
  ) => {
    InCallManager.startRingtone('_DEFAULT_', 0, 'default', 0)
    updateState({
      didcommConnection: connection,
      didcommCallType: callType,
      isVideoCall: callType !== 'audio',
      incomingCallInfo,
      isIncomingCall: true,
    })
  }
 */
  const answerIncomingCall = async () => {
    if (!agent || !didcommConnection || !didcommCallType) return

    stopRingtone()
    const microphonePermission = await handleMicrophonePermission()
    if (!microphonePermission) return
    updateState({ isIncomingCall: false, isInCall: true })
    await agent.modules.calls.accept({ connectionId: didcommConnection.id, parameters: {} })
  }

  const rejectIncomingCall = async () => {
    if (!agent || !didcommConnection) return

    await agent.modules.calls.reject({ connectionId: didcommConnection.id })
    stopRingtone()
    onCallFinished(0)
  }

  const startCall = useCallback(async (args: StartCallPros) => {
    if (!isNetworkConnectedRef.current) {
      toast({ type: 'error', message: t('call.youNeedInternetConnection') })
      return
    }
    const microphonePermission = await handleMicrophonePermission()
    if (!microphonePermission) return
    updateState({
      didcommConnection: args.connection,
      didcommCallType: args.callType,
      isVideoCall: args.callType !== 'audio',
      isInCall: true,
    })
  }, [])

  const onMissedCall = () => {
    stopRingtone()
    onCallFinished(0)
  }

  const onCallFinished = (timeout = 2000) => {
    setTimeout(() => {
      updateState({ isFinishedCall: true })
      updateState(stateInitialValues)
      updateCallStatus(connectionStatusInitialValues)
    }, timeout)
  }

  const joinCall = useCallback(
    async (
      connectionId: string,
      callType: DidCommCallType,
      incomingCallInfo: CallInfo,
      didcommThreadId: string,
    ) => {
      if (!agent || !connectionId || !callType || !incomingCallInfo) return
      if (!isNetworkConnectedRef.current) {
        toast({ type: 'error', message: t('call.youNeedInternetConnection') })
        return
      }
      const microphonePermission = await handleMicrophonePermission()
      if (!microphonePermission) return
      const cameraPermission = await handleCameraPermission()
      if (!cameraPermission) return
      const connection = await agent.connections.getById(connectionId)
      updateState({
        didcommThreadId,
        didcommConnection: connection,
        didcommCallType: callType,
        isVideoCall: callType !== 'audio',
        incomingCallInfo,
        isInCall: true,
        isCameraOn: true,
      })
      await agent.modules.calls.accept({ connectionId: connection.id, parameters: {} })
    },
    [agent],
  )

  useEffect(() => {
    if (agent) {
      const agentMessageProcessedListener = async (data: AgentMessageProcessedEvent) => {
        const { message } = data.payload

        // Call reject
        if (message.type === CallRejectMessage.type.messageTypeUri) {
          // TODO Handle reject incoming call
          updateState({ isRejected: true })
        }

        // Call accept
        if (message.type === CallAcceptMessage.type.messageTypeUri) {
          // TODO Handle accept incoming call
        }

        // Call end (hangup)
        if (message.type === CallEndMessage.type.messageTypeUri) {
          if (remotePeerClosedTimeoutRef.current) clearTimeout(remotePeerClosedTimeoutRef.current)
          if (stateRef.current.isIncomingCall) onMissedCall()
        }
      }

      agent.events.on<AgentMessageProcessedEvent>(
        AgentEventTypes.AgentMessageProcessed,
        agentMessageProcessedListener,
      )

      return () => {
        agent.events.off(AgentEventTypes.AgentMessageProcessed, agentMessageProcessedListener)
      }
    }
  }, [agent, realm, activeChatThreadId])

  return (
    <VideoCallContext
      value={{
        ...state,
        startCall,
        connectionStatus,
        updateCallStatus,
        onCallFinished,
        answerIncomingCall,
        rejectIncomingCall,
        handleCamera,
        remotePeerClosedTimeoutRef,
        joinCall,
      }}
    >
      <View style={{ flex: 1 }}>
        <Modal visible={isIncomingCall || isInCall}>
          {isIncomingCall && <IncomingCall />}
          {isInCall && <VideoCall />}
        </Modal>
        {children}
      </View>
    </VideoCallContext>
  )
}
