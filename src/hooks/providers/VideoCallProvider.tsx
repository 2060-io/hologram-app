import { AgentEventTypes, AgentMessageProcessedEvent, ConnectionRecord } from '@credo-ts/core'
import React, { PropsWithChildren, useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { View, Modal } from 'react-native'
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
  IncomingCallInfo,
} from './useVideoCallContext'

import { VideoCall, IncomingCall } from '@2060/components'
import * as chatEntryService from '@2060/hooks/agent/chat/services/ChatEntryService'
import * as chatThreadService from '@2060/hooks/agent/chat/services/ChatThreadService'
import { ChatEntryRole, ChatEntryState, ChatEntryType } from '@2060/model'
import {
  CallAcceptMessage,
  CallEndMessage,
  CallOfferMessage,
  CallRejectMessage,
} from '@2060/services/agent/calls'
import { DidCommCallType } from '@2060/services/agent/calls/messages/CallOfferMessage'
import { log } from '@2060/utils'
import { handleCameraPermission, handleMicrophonePermission } from '@2060/utils/permissions'
import { toast } from '@2060/utils/toast'

const stateInitialValues: StateProps = {
  isCameraOn: false,
  isInCall: false,
  isIncomingCall: false,
  isVideoCall: false,
  isRejected: undefined,
  incomingCallInfo: undefined,
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
  const remotePeerClosedTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const { isCameraOn, isInCall, isIncomingCall, didcommConnection, didcommCallType } = state
  const { agent } = useMobileAgent()
  const { realm } = useLocalRealm()
  const { activeChatThread } = useChats()
  const { assertConnectedNetwork } = useNetwork()
  const isNetworkConnected = assertConnectedNetwork()
  const isNetworkConnectedRef = useRef<boolean>()

  useEffect(() => {
    isNetworkConnectedRef.current = isNetworkConnected
  }, [isNetworkConnected])

  const updateState = (newStateValues: Partial<StateProps>) => {
    setState(prevState => ({ ...prevState, ...newStateValues }))
    stateRef.current = { ...stateRef.current, ...newStateValues }
  }

  const handleCamera = async () => {
    const cameraPermission = await handleCameraPermission()
    if (!cameraPermission) return
    updateState({ isCameraOn: !isCameraOn })
  }

  const stopRingtone = () => InCallManager.stopRingtone()

  /*
  const startIncomingCall = (
    connection: ConnectionRecord,
    callType: DidCommCallType,
    incomingCallInfo: IncomingCallInfo,
  ) => {
    InCallManager.startRingtone('_DEFAULT_', 0, 'default', 0)
    updateState({
      didcommConnection: connection,
      didcommCallType: callType,
      isVideoCall: callType === 'video',
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
    log('isNetworkConnected', isNetworkConnectedRef.current)
    if (!isNetworkConnectedRef.current) {
      toast({ type: 'error', message: t('call.youNeedInternetConnection') })
      return
    }
    const microphonePermission = await handleMicrophonePermission()
    if (!microphonePermission) return
    updateState({
      didcommConnection: args.connection,
      didcommCallType: args.callType,
      isVideoCall: args.callType === 'video',
      isInCall: true,
    })
  }, [])

  const onMissedCall = () => {
    stopRingtone()
    onCallFinished(0)
  }

  const finishCall = () => {
    updateCallStatus({ status: CallStatus.Finished, statusMessage: t('call.callEnded') })
    onCallFinished()
  }

  const onCallFinished = (timeout = 2000) => {
    setTimeout(() => {
      updateState({ isFinishedCall: true })
      updateState(stateInitialValues)
      updateCallStatus(connectionStatusInitialValues)
    }, timeout)
  }

  const joinToCallOffer = useCallback(
    async (connectionId: string, callType: DidCommCallType, incomingCallInfo: IncomingCallInfo) => {
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
        didcommConnection: connection,
        didcommCallType: callType,
        isVideoCall: callType === 'video',
        incomingCallInfo,
        isInCall: true,
      })
      await agent.modules.calls.accept({ connectionId: connection.id, parameters: {} })
    },
    [agent],
  )

  const createChatEntry = useCallback(
    async (connection: ConnectionRecord, callType: DidCommCallType, incomingCallInfo: IncomingCallInfo) => {
      if (!agent || !realm) return
      const thread = chatThreadService.findOrCreateChatThread(realm, connection)
      const chatEntry = chatEntryService.createChatEntry(realm, {
        chatThreadId: thread.id,
        type: ChatEntryType.CallOffer,
        role: ChatEntryRole.Receiver,
        state: ChatEntryState.Received,
        metadata: { callOfferInfo: JSON.stringify({ callType, incomingCallInfo }) },
        associatedRecordId: 'estevaloresfalso',
        // createdAt: (options.receivedAt ?? new Date(basicMessageRecord.sentTime)).getTime(),
      })
      chatThreadService.updateThread(realm, thread.id, { lastChatEntry: chatEntry })
      if (thread.id !== activeChatThread) {
        chatThreadService.addUnread(realm, thread.id, 1)
      }
    },
    [agent, realm, activeChatThread],
  )

  useEffect(() => {
    if (agent) {
      const agentMessageProcessedListener = async (data: AgentMessageProcessedEvent) => {
        const { message, connection } = data.payload
        if (!connection) return

        // Call offer
        if (message.type === CallOfferMessage.type.messageTypeUri) {
          const callType = (message as CallOfferMessage).callType as DidCommCallType
          const parameters = (message as CallOfferMessage).parameters
          const incomingCallInfo = parameters as IncomingCallInfo
          if (!incomingCallInfo) {
            log(`no incomingCallInfo Parameters: ${JSON.stringify(parameters)}`)
            return
          }
          //startIncomingCall(connection, callType, incomingCallInfo)
          createChatEntry(connection, callType, incomingCallInfo)
        }

        // Call reject
        if (message.type === CallRejectMessage.type.messageTypeUri) {
          // TODO Manejar reject
          updateState({ isRejected: true })
        }

        // Call accept
        if (message.type === CallAcceptMessage.type.messageTypeUri) {
          // TODO Manejar accept
          // parameters.peerId
        }

        // Call end (hangup)
        if (message.type === CallEndMessage.type.messageTypeUri) {
          if (remotePeerClosedTimeoutRef.current) clearTimeout(remotePeerClosedTimeoutRef.current)
          stateRef.current.isIncomingCall ? onMissedCall() : finishCall()
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
  }, [agent, realm, activeChatThread])

  return (
    <VideoCallContext.Provider
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
        joinToCallOffer,
      }}
    >
      <View style={{ flex: 1 }}>
        <Modal visible={isIncomingCall || isInCall}>
          {isIncomingCall && <IncomingCall />}
          {isInCall && <VideoCall />}
        </Modal>
        {children}
      </View>
    </VideoCallContext.Provider>
  )
}
