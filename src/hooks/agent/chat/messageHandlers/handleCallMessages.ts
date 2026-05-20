import { CallEndMessage, CallOfferMessage, CallRejectMessage, DidCommCallType } from '@2060.io/credo-ts-didcomm-calls'
import { DidCommConnectionRecord, DidCommMessage, parseMessageType } from '@credo-ts/didcomm'
import { CallInfo } from '@src/hooks/providers/useVideoCallContext'
import { CallOfferMetadata, CallOfferState, ChatEntryRole, ChatEntryState, ChatEntryType } from '@src/model'
import { logError } from '@src/utils'
import Realm from 'realm'
import { DidCommMessageDirection } from '../DidCommMessageDirection'
import { createChatEntry, findAllDidcommThreadId, updateChatEntryMetadata } from '../services/ChatEntryService'
import { addUnread, findOrCreateChatThread } from '../services/ChatThreadService'

export const handleCallMessages = (options: {
  realm: Realm
  connection?: DidCommConnectionRecord
  activeChatThreadId?: string
  receivedAt?: Date
  message: DidCommMessage
  direction: DidCommMessageDirection
}) => {
  const { realm, connection, activeChatThreadId, receivedAt, message, direction } = options
  const messageType = parseMessageType(message.type)
  if (messageType.messageTypeUri === CallOfferMessage.type.messageTypeUri) {
    const callOfferMessage = message as CallOfferMessage
    const callType = callOfferMessage.callType as DidCommCallType
    const { parameters, description, offerExpirationTime } = callOfferMessage
    const incomingCallInfo = parameters as CallInfo
    if (!incomingCallInfo) {
      logError(`no incomingCallInfo Parameters: ${JSON.stringify(parameters)}`)
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
    if (direction === 'inbound' && thread.id !== activeChatThreadId) {
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
  if (messageType.messageTypeUri === CallEndMessage.type.messageTypeUri) {
    const [chatEntry] = findAllDidcommThreadId(realm, message.threadId, ChatEntryType.CallOffer)
    if (chatEntry) {
      const newMetadata = {
        ...chatEntry.metadata,
        state: CallOfferState.FINISHED,
      } as CallOfferMetadata
      updateChatEntryMetadata(realm, chatEntry.id, newMetadata)
    }
  }
}
