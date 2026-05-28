import {
  CallAcceptMessage,
  CallEndMessage,
  CallOfferMessage,
  CallRejectMessage,
  DidCommCallType,
} from '@2060.io/credo-ts-didcomm-calls'
import { DidCommEventTypes, DidCommMessageProcessedEvent, DidCommMessageSentEvent } from '@credo-ts/didcomm'
import { IncomingCall, VideoCall } from '@src/components'
import { Modal } from '@src/components/common'
import { handleCameraPermission, handleMicrophonePermission } from '@src/utils/permissions'
import { toast } from '@src/utils/toast'
import React, { PropsWithChildren, useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import InCallManager from 'react-native-incall-manager'
import { useChats, useMobileAgent } from '../agent'
import { useNetwork } from '../useNetwork'
import { useLocalRealm } from './RealmProvider'
import {
  CallInfo,
  CallStatus,
  ConnectionStatus,
  StartCallPros,
  StateProps,
  VideoCallContext,
} from './useVideoCallContext'

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
    setState((prevState) => ({ ...prevState, ...newStateValues }))
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
    connection: DidCommConnectionRecord,
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
    async (connectionId: string, callType: DidCommCallType, incomingCallInfo: CallInfo, didcommThreadId: string) => {
      if (!agent || !connectionId || !callType || !incomingCallInfo) return
      if (!isNetworkConnectedRef.current) {
        toast({ type: 'error', message: t('call.youNeedInternetConnection') })
        return
      }
      const microphonePermission = await handleMicrophonePermission()
      if (!microphonePermission) return
      const cameraPermission = await handleCameraPermission()
      if (!cameraPermission) return
      const connection = await agent.didcomm.connections.getById(connectionId)
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
    [agent]
  )

  useEffect(() => {
    if (agent) {
      const agentMessageSentListener = async (data: DidCommMessageSentEvent) => {
        const { message } = data.payload.message
        if (message.type === CallOfferMessage.type.messageTypeUri) {
          updateState({ didcommThreadId: message.threadId })
        }
      }
      const agentMessageProcessedListener = async (data: DidCommMessageProcessedEvent) => {
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

      agent.events.on(DidCommEventTypes.DidCommMessageSent, agentMessageSentListener)
      agent.events.on<DidCommMessageProcessedEvent>(
        DidCommEventTypes.DidCommMessageProcessed,
        agentMessageProcessedListener
      )

      return () => {
        agent.events.off(DidCommEventTypes.DidCommMessageSent, agentMessageSentListener)
        agent.events.off(DidCommEventTypes.DidCommMessageProcessed, agentMessageProcessedListener)
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
      <View style={styles.container}>
        <Modal visible={isIncomingCall || isInCall}>
          {isIncomingCall && <IncomingCall />}
          {isInCall && <VideoCall />}
        </Modal>
        {children}
      </View>
    </VideoCallContext>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
