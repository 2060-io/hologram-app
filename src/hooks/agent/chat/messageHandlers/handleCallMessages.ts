import { CallOfferMessage, CallRejectMessage, DidCommCallType } from '@2060.io/credo-ts-didcomm-calls'
import { AgentMessage, ConnectionRecord, parseMessageType } from '@credo-ts/core'
import Realm from 'realm'

import * as chatEntryService from '../services/ChatEntryService'
import * as chatThreadService from '../services/ChatThreadService'

import { IncomingCallInfo } from '@2060/hooks/providers/useVideoCallContext'
import { CallOfferMetadata, CallOfferState, ChatEntryRole, ChatEntryState, ChatEntryType } from '@2060/model'
import { log } from '@2060/utils'

export const handleCallMessages = (options: {
  realm: Realm
  connection?: ConnectionRecord
  activeChatThreadId?: string
  receivedAt?: Date
  message: AgentMessage
}) => {
  const { realm, connection, activeChatThreadId, receivedAt, message } = options
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
    const thread = chatThreadService.findOrCreateChatThread(realm, connection!)
    const { roomId, wsUrl, peerId } = incomingCallInfo
    const chatEntry = chatEntryService.createChatEntry(realm, {
      chatThreadId: thread.id,
      type: ChatEntryType.CallOffer,
      role: ChatEntryRole.Receiver,
      state: ChatEntryState.Received,
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
    chatThreadService.updateThread(realm, thread.id, { lastChatEntry: chatEntry })
    if (thread.id !== activeChatThreadId) {
      chatThreadService.addUnread(realm, thread.id, 1)
    }
  }
  if (messageType.messageTypeUri === CallRejectMessage.type.messageTypeUri) {
    const [chatEntry] = chatEntryService.findAllDidcommThreadId(
      realm,
      message.threadId,
      ChatEntryType.CallOffer,
    )
    if (chatEntry) {
      const newMetadata = {
        ...chatEntry.metadata,
        state: CallOfferState.REJECTED,
      } as CallOfferMetadata
      chatEntryService.updateMetadata(realm, chatEntry.id, newMetadata)
    }
  }
}
