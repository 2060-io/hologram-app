import { AgentEventTypes, AgentMessageProcessedEvent, ConnectionRecord } from '@credo-ts/core'
import React, { PropsWithChildren, useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { View, Modal } from 'react-native'
import InCallManager from 'react-native-incall-manager'

import { useMobileAgent } from '../agent'

import {
  VideoCallContext,
  StateProps,
  StartCallPros,
  ConnectionStatus,
  CallStatus,
  IncomingCallInfo,
} from './useVideoCallContext'

import { VideoCall, IncomingCall } from '@2060/components'
import {
  CallAcceptMessage,
  CallEndMessage,
  CallOfferMessage,
  CallRejectMessage,
} from '@2060/services/agent/calls'
import { DidCommCallType } from '@2060/services/agent/calls/messages/CallOfferMessage'
import { log } from '@2060/utils'

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

  const updateState = (newStateValues: Partial<StateProps>) => {
    setState(prevState => ({ ...prevState, ...newStateValues }))
    stateRef.current = { ...stateRef.current, ...newStateValues }
  }

  const handleCamera = () => updateState({ isCameraOn: !isCameraOn })

  const stopRingtone = () => InCallManager.stopRingtone()

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

  const answerIncomingCall = async () => {
    if (!agent || !didcommConnection || !didcommCallType) return

    stopRingtone()
    updateState({ isIncomingCall: false, isInCall: true })

    await agent.modules.calls.accept({ connectionId: didcommConnection.id, parameters: {} })
  }

  const rejectIncomingCall = async () => {
    if (!agent || !didcommConnection) return

    await agent.modules.calls.reject({ connectionId: didcommConnection.id })
    stopRingtone()
    onCallFinished(0)
  }

  const startCall = (args: StartCallPros) => {
    updateState({
      didcommConnection: args.connection,
      didcommCallType: args.callType,
      isVideoCall: args.callType === 'video',
      isInCall: true,
    })
  }

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
          startIncomingCall(connection, callType, incomingCallInfo)
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
  }, [agent])

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
