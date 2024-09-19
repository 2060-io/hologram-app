import { ConnectionRecord } from '@credo-ts/core'
import { createContext, useContext, MutableRefObject } from 'react'

import { DidCommCallType } from '@2060/services/agent/calls/messages/CallOfferMessage'

export enum CallStatus {
  Connecting = 'Connecting',
  Connected = 'Connected',
  Disconnected = 'Disconnected',
  Finished = 'Finished',
}

export type ConnectionStatus = {
  status: CallStatus
  statusMessage: string
}

export type IncomingCallInfo = {
  roomId: string
  wsUrl: string
}

export type StateProps = {
  isCameraOn: boolean
  isInCall: boolean
  isIncomingCall: boolean
  isVideoCall: boolean
  isRejected: boolean | undefined
  incomingCallInfo: IncomingCallInfo | undefined
  didcommConnection: ConnectionRecord | undefined
  didcommCallType: DidCommCallType | undefined
  isFinishedCall: boolean
}

export type StartCallPros = {
  connection: ConnectionRecord
  callType: DidCommCallType
}

interface VideoCallProps extends StateProps {
  startCall: (args: StartCallPros) => void
  onCallFinished: () => void
  answerIncomingCall: () => void
  rejectIncomingCall: () => void
  handleCamera: () => void
  remotePeerClosedTimeoutRef: MutableRefObject<NodeJS.Timeout | undefined>
  connectionStatus: ConnectionStatus
  updateCallStatus: React.Dispatch<React.SetStateAction<ConnectionStatus>>
  joinToCallOffer: (
    connectionId: string,
    callType: DidCommCallType,
    incomingCallInfo: IncomingCallInfo,
  ) => void
}

export const VideoCallContext = createContext<VideoCallProps | undefined>(undefined)

export const useVideoCallContext = () => {
  const videoCallContext = useContext(VideoCallContext)
  if (!videoCallContext) throw new Error('useVideoCallContext must be used within a VideoCallContextProvider')
  return videoCallContext
}
