import { CallOfferMessage, DidCommCallType } from '@2060.io/credo-ts-didcomm-calls'
import { AgentMessage, ConnectionRecord } from '@credo-ts/core'
import Realm from 'realm'

import * as chatEntryService from '../services/ChatEntryService'
import * as chatThreadService from '../services/ChatThreadService'

import { IncomingCallInfo } from '@2060/hooks/providers/useVideoCallContext'
import { ChatEntryRole, ChatEntryState, ChatEntryType } from '@2060/model'
import { log } from '@2060/utils'

export const handleCallMessages = (options: {
  realm: Realm
  connection?: ConnectionRecord
  activeChatThreadId?: string
  receivedAt?: Date
  message: AgentMessage
}) => {
  const { realm, connection, activeChatThreadId, receivedAt, message } = options

  const callType = (message as CallOfferMessage).callType as DidCommCallType
  const parameters = (message as CallOfferMessage).parameters
  const incomingCallInfo = parameters as IncomingCallInfo
  if (!incomingCallInfo) {
    log(`no incomingCallInfo Parameters: ${JSON.stringify(parameters)}`)
    return
  }
  const thread = chatThreadService.findOrCreateChatThread(realm, connection!)
  const { roomId, wsUrl, peerId } = incomingCallInfo
  const chatEntry = chatEntryService.createChatEntry(realm, {
    chatThreadId: thread.id,
    type: ChatEntryType.CallOffer,
    role: ChatEntryRole.Receiver,
    state: ChatEntryState.Received,
    metadata: { callType, roomId, wsUrl, peerId },
    associatedRecordId: '',
    createdAt: (receivedAt ?? new Date()).getTime(),
  })
  chatThreadService.updateThread(realm, thread.id, { lastChatEntry: chatEntry })
  if (thread.id !== activeChatThreadId) {
    chatThreadService.addUnread(realm, thread.id, 1)
  }
}
