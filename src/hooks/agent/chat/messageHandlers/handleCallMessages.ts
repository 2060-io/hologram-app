import { CallOfferMessage, CallRejectMessage, DidCommCallType } from '@2060.io/credo-ts-didcomm-calls'
import { AgentMessage, ConnectionRecord, parseMessageType } from '@credo-ts/core'
import Realm from 'realm'

import { DidCommMessageDirection } from '../DidCommMessageDirection'
import {
  createChatEntry,
  findAllDidcommThreadId,
  updateChatEntryMetadata,
} from '../services/ChatEntryService'
import { addUnread, findOrCreateChatThread } from '../services/ChatThreadService'

import { IncomingCallInfo } from '@2060/hooks/providers/useVideoCallContext'
import { CallOfferMetadata, CallOfferState, ChatEntryRole, ChatEntryState, ChatEntryType } from '@2060/model'
import { log } from '@2060/utils'

export const handleCallMessages = (options: {
  realm: Realm
  connection?: ConnectionRecord
  activeChatThreadId?: string
  receivedAt?: Date
  message: AgentMessage
  direction: DidCommMessageDirection
}) => {
  const { realm, connection, activeChatThreadId, receivedAt, message, direction } = options
  const messageType = parseMessageType(message.type)
  if (messageType.messageTypeUri === CallOfferMessage.type.messageTypeUri) {
    const callOfferMessage = message as CallOfferMessage
    const callType = callOfferMessage.callType as DidCommCallType
    const { parameters, description, offerExpirationTime } = callOfferMessage
    const incomingCallInfo = parameters as IncomingCallInfo
    if (!incomingCallInfo) {
      log(`no incomingCallInfo Parameters: ${JSON.stringify(parameters)}`)
      return
    }
    const thread = findOrCreateChatThread(realm, connection!)
    const { roomId, wsUrl, peerId } = incomingCallInfo
    createChatEntry(realm, {
      chatThreadId: thread.id,
      type: ChatEntryType.CallOffer,
      role: direction === 'inbound' ? ChatEntryRole.Receiver : ChatEntryRole.Sender,
      state: direction === 'inbound' ? ChatEntryState.Received : ChatEntryState.Submitted,
      metadata: {
        callType,
        roomId,
        wsUrl,
        peerId,
        state: CallOfferState.RECEIVED,
        description,
        offerExpirationTime: offerExpirationTime?.getTime(),
      } as CallOfferMetadata,
      associatedRecordId: '',
      createdAt: (receivedAt ?? new Date()).getTime(),
      didcommThreadId: message.threadId,
    })
    if (thread.id !== activeChatThreadId) {
      addUnread(realm, thread.id, 1)
    }
  }
  if (messageType.messageTypeUri === CallRejectMessage.type.messageTypeUri) {
    const [chatEntry] = findAllDidcommThreadId(realm, message.threadId, ChatEntryType.CallOffer)
    if (chatEntry) {
      const newMetadata = {
        ...chatEntry.metadata,
        state: CallOfferState.REJECTED,
      } as CallOfferMetadata
      updateChatEntryMetadata(realm, chatEntry.id, newMetadata)
    }
  }
}
