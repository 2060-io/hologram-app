import { DidCommCallType } from '@2060.io/credo-ts-didcomm-calls'
import { ConnectionRecord } from '@credo-ts/core'
import { createContext, useContext, MutableRefObject } from 'react'

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

export type CallInfo = {
  roomId: string
  peerId?: string
  wsUrl: string
}

export type StateProps = {
  isCameraOn: boolean
  isInCall: boolean
  isIncomingCall: boolean
  isVideoCall: boolean
  isRejected: boolean | undefined
  incomingCallInfo: CallInfo | undefined
  didcommThreadId: string | undefined
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
  handleCamera: (callBack?: (newIsCameraOn: boolean) => void) => void
  remotePeerClosedTimeoutRef: MutableRefObject<NodeJS.Timeout | undefined>
  connectionStatus: ConnectionStatus
  updateCallStatus: React.Dispatch<React.SetStateAction<ConnectionStatus>>
  joinCall: (
    connectionId: string,
    callType: DidCommCallType,
    incomingCallInfo: CallInfo,
    didcommThreadId: string,
  ) => void
}

export const VideoCallContext = createContext<VideoCallProps | undefined>(undefined)

export const useVideoCallContext = () => {
  const videoCallContext = useContext(VideoCallContext)
  if (!videoCallContext) throw new Error('useVideoCallContext must be used within a VideoCallContextProvider')
  return videoCallContext
}

export function isIncomingCallInfo(data: Record<string, unknown>): data is CallInfo {
  return (
    typeof data === 'object' &&
    typeof data.roomId === 'string' &&
    (data.peerId === undefined || typeof data.peerId === 'string') &&
    typeof data.wsUrl === 'string'
  )
}
