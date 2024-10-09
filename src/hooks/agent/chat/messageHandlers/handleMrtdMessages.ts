import { EMrtdDataRequestMessage, MrzDataRequestMessage } from '@2060.io/credo-ts-didcomm-mrtd'
import { AgentMessage, ConnectionRecord, parseMessageType } from '@credo-ts/core'
import Realm from 'realm'

import { DidCommMessageDirection } from '../DidCommMessageDirection'
import * as chatEntryService from '../services/ChatEntryService'
import * as chatThreadService from '../services/ChatThreadService'

import { ChatEntryRole, ChatEntryState, ChatEntryType } from '@2060/model'

export const handleMrtdMessages = (options: {
  realm: Realm
  connection: ConnectionRecord
  activeChatThreadId?: string
  receivedAt?: Date
  message: AgentMessage
  direction: DidCommMessageDirection
}) => {
  const { realm, connection, activeChatThreadId, receivedAt, message, direction } = options
  // find associated thread according to the connection id. If not found, create it
  const thread = chatThreadService.findOrCreateChatThread(realm, connection)
  const messageType = parseMessageType(message.type)

  // MRZ Request
  if (messageType.messageTypeUri === MrzDataRequestMessage.type.messageTypeUri) {
    const chatEntry = chatEntryService.createChatEntry(realm, {
      chatThreadId: thread.id,
      type: ChatEntryType.MrzRequest,
      role: direction === 'inbound' ? ChatEntryRole.Receiver : ChatEntryRole.Sender,
      createdAt: (receivedAt ?? new Date()).getTime(),
      state: ChatEntryState.Received,
      associatedRecordId: '',
    })
    chatThreadService.updateThread(realm, thread.id, { lastChatEntry: chatEntry })
    if (thread.id !== activeChatThreadId) {
      chatThreadService.addUnread(realm, thread.id, 1)
    }
  }

  // eMRTD Data Read Request
  if (messageType.messageTypeUri === EMrtdDataRequestMessage.type.messageTypeUri) {
    const chatEntry = chatEntryService.createChatEntry(realm, {
      chatThreadId: thread.id,
      type: ChatEntryType.EMrtdReadRequest,
      role: direction === 'inbound' ? ChatEntryRole.Receiver : ChatEntryRole.Sender,
      createdAt: (receivedAt ?? new Date()).getTime(),
      state: ChatEntryState.Received,
      associatedRecordId: '',
    })
    chatThreadService.updateThread(realm, thread.id, { lastChatEntry: chatEntry })
    if (thread.id !== activeChatThreadId) {
      chatThreadService.addUnread(realm, thread.id, 1)
    }
  }
}
