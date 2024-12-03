import {
  EMrtdDataMessage,
  EMrtdDataRequestMessage,
  MrtdProblemReportMessage,
  MrtdProblemReportReason,
  MrzDataMessage,
  MrzDataRequestMessage,
} from '@2060.io/credo-ts-didcomm-mrtd'
import { AgentMessage, ConnectionRecord, parseMessageType, ProblemReportMessage } from '@credo-ts/core'
import * as Mrz from 'mrz'
import Realm from 'realm'

import { DidCommMessageDirection } from '../DidCommMessageDirection'
import * as chatEntryService from '../services/ChatEntryService'
import * as chatThreadService from '../services/ChatThreadService'

import {
  ChatEntryRole,
  ChatEntryState,
  ChatEntryType,
  EMrtdReadRequestMetadata,
  MrzRequestMetadata,
} from '@2060/model'
import { log } from '@2060/utils'

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
      associatedMessageId: message.id,
      didcommThreadId: message.threadId,
      metadata: {
        state: 'received',
        parentThreadId: message.thread?.parentThreadId,
      } as MrzRequestMetadata,
    })
    chatThreadService.updateThread(realm, thread.id, { lastChatEntry: chatEntry })
    if (thread.id !== activeChatThreadId) {
      chatThreadService.addUnread(realm, thread.id, 1)
    }
  }

  if (messageType.messageTypeUri === MrzDataMessage.type.messageTypeUri) {
    // Find the associated entry and update it with MRZ
    const [chatEntry] = chatEntryService.findAllDidcommThreadId(
      realm,
      message.threadId,
      ChatEntryType.MrzRequest,
    )
    if (chatEntry) {
      const newMetadata = {
        ...chatEntry.metadata,
        state: 'scanned',
        mrzData: (message as MrzDataMessage).mrzData,
      } as MrzRequestMetadata
      chatEntryService.updateMetadata(realm, chatEntry.id, newMetadata)
    }
  }

  // eMRTD Data Read Request
  if (messageType.messageTypeUri === EMrtdDataRequestMessage.type.messageTypeUri) {
    // Find the related MRZ request and use MRZ data for eMRTD authentication
    const parentThreadId = message.thread?.parentThreadId
    let mrzInfo: { expirationDate: string; documentNumber: string; birthDate: string } | undefined
    if (parentThreadId) {
      const [mrzRequest] = chatEntryService.findAllDidcommThreadId(
        realm,
        parentThreadId,
        ChatEntryType.MrzRequest,
      )
      if (mrzRequest) {
        const mrzData = (mrzRequest.metadata as MrzRequestMetadata)?.mrzData
        if (mrzData) {
          const { documentNumber, birthDate, expirationDate } = Mrz.parse(mrzData).fields

          if (documentNumber && birthDate && expirationDate) {
            mrzInfo = { documentNumber, birthDate, expirationDate }
          }
        }
      } else {
        log('No MRZ Request found')
      }
    }

    const chatEntry = chatEntryService.createChatEntry(realm, {
      chatThreadId: thread.id,
      type: ChatEntryType.EMrtdReadRequest,
      role: direction === 'inbound' ? ChatEntryRole.Receiver : ChatEntryRole.Sender,
      createdAt: (receivedAt ?? new Date()).getTime(),
      state: ChatEntryState.Received,
      associatedRecordId: '',
      didcommThreadId: message.threadId,
      metadata: {
        state: 'received',
        parentThreadId: message.thread?.parentThreadId,
        mrzInfo: JSON.stringify(mrzInfo),
      } as EMrtdReadRequestMetadata,
    })
    chatThreadService.updateThread(realm, thread.id, { lastChatEntry: chatEntry })
    if (thread.id !== activeChatThreadId) {
      chatThreadService.addUnread(realm, thread.id, 1)
    }
  }

  if (messageType.messageTypeUri === EMrtdDataMessage.type.messageTypeUri) {
    // Find the associated entry and update its status
    const [chatEntry] = chatEntryService.findAllDidcommThreadId(
      realm,
      message.threadId,
      ChatEntryType.EMrtdReadRequest,
    )
    if (chatEntry) {
      const newMetadata = {
        ...chatEntry.metadata,
        state: 'scanned',
      } as EMrtdReadRequestMetadata
      chatEntryService.updateMetadata(realm, chatEntry.id, newMetadata)
    }
  }

  if (messageType.messageTypeUri === MrtdProblemReportMessage.type.messageTypeUri) {
    const problemReportMessage = message as ProblemReportMessage
    const code = problemReportMessage.description.code as MrtdProblemReportReason
    if (![MrtdProblemReportReason.MrzRefused, MrtdProblemReportReason.EmrtdRefused].includes(code)) {
      return
    }
    const isMrz = code === MrtdProblemReportReason.MrzRefused
    const chatEntryType = isMrz ? ChatEntryType.MrzRequest : ChatEntryType.EMrtdReadRequest
    // Find the associated entry and update its status
    const [chatEntry] = chatEntryService.findAllDidcommThreadId(realm, message.threadId, chatEntryType)
    if (chatEntry) {
      const newMetadata = isMrz
        ? ({
            ...chatEntry.metadata,
            state: 'aborted',
          } as MrzRequestMetadata)
        : ({
            ...chatEntry.metadata,
            state: 'aborted',
          } as EMrtdReadRequestMetadata)
      chatEntryService.updateMetadata(realm, chatEntry.id, newMetadata)
    }
  }
}
