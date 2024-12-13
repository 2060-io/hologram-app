import { CallOfferMessage } from '@2060.io/credo-ts-didcomm-calls'
import { MrzDataRequestMessage } from '@2060.io/credo-ts-didcomm-mrtd'
import { ConnectionProfileUpdatedEvent, ProfileEventTypes } from '@2060.io/credo-ts-didcomm-user-profile'
import { V1ProposeCredentialMessage, V1ProposePresentationMessage } from '@credo-ts/anoncreds'
import {
  AgentEventTypes,
  AgentMessage,
  AgentMessageProcessedEvent,
  AgentMessageSentEvent,
  BasicMessage,
  ConnectionRecord,
  ConnectionType,
  OutOfBandState,
  OutboundMessageSendStatus,
  RecordUpdatedEvent,
  RepositoryEventTypes,
  parseMessageType,
} from '@credo-ts/core'
import { tryParseDid } from '@credo-ts/core/build/modules/dids/domain/parse'
import { QuestionMessage, AnswerMessage } from '@credo-ts/question-answer'
import {
  MediaSharingEventTypes,
  MediaSharingRecord,
  MediaSharingState,
  MediaSharingStateChangedEvent,
  ShareMediaMessage,
} from 'credo-ts-media-sharing'
import { ReceiptsEventTypes, MessageReceiptsReceivedEvent, MessageState } from 'credo-ts-receipts'
import agentActionQueue from 'react-native-job-queue'
import Realm from 'realm'

import { AgentAction, AgentActionType } from '../actions/AgentAction'

import { DidCommMessageDirection } from './DidCommMessageDirection'
import { handleCallMessages, handleMrtdMessages } from './messageHandlers'
import {
  handleBasicMessageRecordChanges,
  handleCredentialExchangeRecordChanges,
  handleProofExchangeRecordChanges,
  handleQuestionAnswerRecordChanges,
} from './recordChangeHandlers'
import { handleMediaSharingRecordChanges } from './recordChangeHandlers/handleMediaSharingRecordChanges'
import * as chatEntryService from './services/ChatEntryService'
import * as chatThreadService from './services/ChatThreadService'

import { ChatEntryType, ChatEntryRole, ChatEntryState, ChatEntry, InvitationMetadata } from '@2060/model'
import { InvitationState } from '@2060/model/InvitationState'
import { MobileAgent } from '@2060/services/agent'
import {
  OutOfBandInvitationEvent,
  OutOfBandInvitationEventTypes,
} from '@2060/services/agent/oob/OutOfBandEvents'
import { MessageReactionsReceivedEvent, ReactionsEventTypes } from '@2060/services/agent/reactions'
import {
  getConnectionDisplayName,
  getConnectionDisplayPicture,
  supportsMessageReceipts,
} from '@2060/utils/connectionUtils'

export function manageAgentChatEvents(agent: MobileAgent, realm: Realm, activeChatThreadId?: string) {
  const connectionProfileListener = async (event: ConnectionProfileUpdatedEvent) => {
    const { connection } = event.payload
    const thread = chatThreadService.findChatThread(realm, connection)
    if (thread) {
      chatThreadService.updateThread(realm, thread.id, {
        topic: getConnectionDisplayName(connection),
        picture: getConnectionDisplayPicture(connection),
      })
    }
  }

  const messageEventsListener = async (options: {
    message: AgentMessage
    direction: DidCommMessageDirection
    connection?: ConnectionRecord
    receivedAt?: Date
  }) => {
    const { message, direction, connection, receivedAt } = options
    const messageType = parseMessageType(message.type)
    if (messageType.protocolName === BasicMessage.type.protocolName) {
      const record = await agent.basicMessages.getByThreadId(message.threadId)
      await handleBasicMessageRecordChanges({
        agent,
        realm,
        record,
        activeChatThreadId,
        receivedAt,
      })
    }

    if (messageType.protocolName === ShareMediaMessage.type.protocolName) {
      const record = await agent.modules.media.findByThreadId(message.threadId)
      if (!record) return
      await handleMediaSharingRecordChanges({
        agent,
        realm,
        record,
        activeChatThreadId,
        receivedAt,
      })
    }

    if (messageType.protocolName === QuestionMessage.type.protocolName) {
      const [record] = await agent.modules.questionAnswer.findAllByQuery({ threadId: message.threadId })
      if (!record) return
      await handleQuestionAnswerRecordChanges({
        agent,
        realm,
        record,
        activeChatThreadId,
        receivedAt,
      })
    }

    if (messageType.protocolName === V1ProposeCredentialMessage.type.protocolName) {
      const [record] = await agent.credentials.findAllByQuery({ threadId: message.threadId })
      if (!record) return
      await handleCredentialExchangeRecordChanges({
        agent,
        realm,
        record,
        activeChatThreadId,
        receivedAt,
        message,
      })
    }

    if (messageType.protocolName === V1ProposePresentationMessage.type.protocolName) {
      const [record] = await agent.proofs.findAllByQuery({ threadId: message.threadId })
      if (!record) return
      await handleProofExchangeRecordChanges({
        agent,
        realm,
        record,
        activeChatThreadId,
      })
    }

    if (messageType.protocolName === V1ProposePresentationMessage.type.protocolName) {
      const [record] = await agent.proofs.findAllByQuery({ threadId: message.threadId })
      if (!record) return
      await handleProofExchangeRecordChanges({
        agent,
        realm,
        record,
        activeChatThreadId,
        receivedAt,
      })
    }

    if (messageType.protocolName === CallOfferMessage.type.protocolName) {
      handleCallMessages({
        realm,
        connection,
        activeChatThreadId,
        receivedAt,
        message,
      })
    }
    if (messageType.protocolName === MrzDataRequestMessage.type.protocolName && connection) {
      handleMrtdMessages({
        realm,
        connection,
        activeChatThreadId,
        receivedAt,
        message,
        direction,
      })
    }
  }

  const agentMessageSentEventListener = async (data: AgentMessageSentEvent) => {
    const outboundMessage = data.payload.message
    const status = data.payload.status
    const associatedRecord = outboundMessage.associatedRecord

    if (
      [OutboundMessageSendStatus.SentToSession, OutboundMessageSendStatus.SentToTransport].includes(status)
    ) {
      await messageEventsListener({
        message: outboundMessage.message,
        direction: 'outbound',
        connection: data.payload.message.connection,
      })

      if (associatedRecord) {
        const entries = chatEntryService.findAllByAssociatedRecordId(realm, associatedRecord.id)
        for (const entry of entries) {
          if (entry && entry.state === ChatEntryState.Created) {
            // Associate chat entry with the outbound message
            chatEntryService.updateState(realm, {
              recordId: entry.id,
              state: ChatEntryState.Created,
              associatedMessageId: outboundMessage.message.id,
            })

            chatThreadService.updateThread(realm, entry.chatThreadId, { lastChatEntry: entry })
          }
        }
      }
    }
  }

  // TODO: Use a dedicated method in chatEntryService for this, in order to set multiple entries
  // in a single write operation
  const messageReceiptsReceivedListener = async (data: MessageReceiptsReceivedEvent) => {
    const receipts = data.payload.receipts
    const connection = await agent.connections.getById(data.payload.connectionId)
    const thread = chatThreadService.findChatThread(realm, connection)

    let lastChatEntry: ChatEntry | undefined

    for (const receipt of receipts) {
      const entry = chatEntryService.addReceiptToRelatedEntries(realm, receipt)
      if (entry && (!lastChatEntry || lastChatEntry?.createdAt < entry.createdAt)) lastChatEntry = entry
    }

    if (
      lastChatEntry &&
      (!thread.lastActivityAt || thread.lastActivityAt.getTime() <= lastChatEntry.createdAt)
    ) {
      chatThreadService.updateThread(realm, thread.id, { lastChatEntry })
    }
  }

  const messageReactionsReceivedListener = async (data: MessageReactionsReceivedEvent) => {
    const reactions = data.payload.reactions

    realm.write(() => {
      for (const reaction of reactions) {
        const relatedEntries = chatEntryService.findAllByAssociatedMessageId(realm, reaction.messageId)
        for (const entry of relatedEntries) {
          const entryReactions = entry.reactions ? entry.reactions : []

          const reactionIndex = entryReactions.findIndex(
            item => item.role === ChatEntryRole.Receiver && item.emoji === reaction.emoji,
          )

          if (reaction.action === 'react' && reactionIndex === -1) {
            entryReactions.push({ emoji: reaction.emoji, role: ChatEntryRole.Receiver })
          }
          if (reaction.action === 'unreact' && reactionIndex !== -1) {
            entryReactions.splice(reactionIndex, 1)
          }
          entry.reactions = entryReactions
          entry.updatedAt = new Date().getTime()
        }
      }
    })
  }

  const agentMessageProcessedListener = async (data: AgentMessageProcessedEvent) => {
    const connection = data.payload.connection
    const receivedAt = data.payload.receivedAt

    // Ignore any message coming directly from mediator
    if (connection?.connectionTypes.includes(ConnectionType.Mediator)) return

    await messageEventsListener({
      message: data.payload.message,
      direction: 'inbound',
      connection,
      receivedAt,
    })

    // Send receipts
    const validMessagesTypesForReceipts = [
      QuestionMessage.type.messageTypeUri,
      AnswerMessage.type.messageTypeUri,
      BasicMessage.type.messageTypeUri,
      ShareMediaMessage.type.messageTypeUri,
    ]

    if (connection) {
      if (
        supportsMessageReceipts(connection) &&
        validMessagesTypesForReceipts.includes(data.payload.message.type)
      ) {
        // Find associated thread and see if it's the active one
        const thread = chatThreadService.findChatThread(realm, connection)

        // If message is part of current active chat thread, send it as viewed directly
        const state = thread && thread.id === activeChatThreadId ? MessageState.Viewed : MessageState.Received

        // TODO: Add to a queue and send receipts in a batch
        const receipt = { messageId: data.payload.message.id, state, timestamp: new Date() }

        chatEntryService.addReceiptToRelatedEntries(realm, receipt)

        agentActionQueue.addJob(
          'AgentAction',
          {
            attempts: 4,
            type: AgentActionType.SendReceipts,
            parameters: {
              didcommConnectionId: connection.id,
              receipts: [
                {
                  messageId: receipt.messageId,
                  state: receipt.state,
                  timestamp: receipt.timestamp?.getTime(),
                },
              ],
            },
          } as AgentAction,
          undefined,
          true,
        )
      }
    }
  }

  const oobListener = async (event: OutOfBandInvitationEvent) => {
    const outOfBandRecord = event.payload.outOfBandRecord
    const action = event.payload.action

    // When an invitation is accepted, we need to update any associated chat entry, regardless
    // of the chat thread it belongs to
    if (action === 'Accepted' || action === 'Refused') {
      // Find Invitation entry associated to this record and mark it as replied
      const invitationEntries = chatEntryService.findAllByAssociatedRecordId(
        realm,
        outOfBandRecord.id,
        ChatEntryType.Invitation,
      )

      for (const invitationEntry of invitationEntries) {
        // only update those entries that are not already marked as "replied"
        if (invitationEntry.metadata?.state === InvitationState.Received) {
          chatEntryService.updateState(realm, {
            recordId: invitationEntry.id,
            state: ChatEntryState.Viewed,
            metadata: {
              ...invitationEntry.metadata,
              state: action === 'Accepted' ? InvitationState.Accepted : InvitationState.Refused,
            },
          })
        }
      }

      // We can safely do an early return now, as threads will not be affected by this action
      return
    }

    // Find associated thread according to the connection id. If not found, create it
    const connection = event.payload.connection
    if (!connection) return

    const thread = chatThreadService.findOrCreateChatThread(realm, connection)
    let chatEntry: ChatEntry | undefined
    if (action === 'Received') {
      const { label, imageUrl, invitationDids, id } = outOfBandRecord.outOfBandInvitation
      const did = tryParseDid(id) ? id : invitationDids[0]
      const [existingConnection] = await agent.connections.findByInvitationDid(did)
      const metadata: InvitationMetadata =
        outOfBandRecord.state === OutOfBandState.Done
          ? {
              state: InvitationState.AlreadyConnected,
              label: existingConnection
                ? getConnectionDisplayName(existingConnection)
                : (label ?? 'Unlabeled'),
              imageUrl: existingConnection ? getConnectionDisplayPicture(existingConnection) : imageUrl,
              did,
            }
          : {
              state: InvitationState.Received,
              label: label ?? 'Unlabeled', // TODO: Handle properly when label is not set
              imageUrl,
              did,
            }

      // New Invitation Received ChatEntry
      chatEntry = chatEntryService.createChatEntry(realm, {
        associatedRecordId: outOfBandRecord.id,
        chatThreadId: thread.id,
        type: ChatEntryType.Invitation,
        role: ChatEntryRole.Receiver,
        state: ChatEntryState.Received,
        metadata,
        createdAt: new Date().getTime(),
      })
      chatThreadService.updateThread(realm, thread.id, { lastChatEntry: chatEntry })
    }
  }

  // We'll handle the particular case of Media created to react immediately to it (TODO: remove as soon as
  //  we implement AgentActions)
  const mediaSharingCreationEventListener = async (data: MediaSharingStateChangedEvent) => {
    const record = data.payload.mediaSharingRecord
    if (record.state === MediaSharingState.Init) {
      await handleMediaSharingRecordChanges({
        agent,
        realm,
        record,
        activeChatThreadId,
      })
    }
  }
  const mediaSharingMetadataUpdateListener = async (data: RecordUpdatedEvent<MediaSharingRecord>) => {
    const record = data.payload.record
    if (record?.type !== MediaSharingRecord.type) return
    await handleMediaSharingRecordChanges({
      agent,
      realm,
      record,
      activeChatThreadId,
    })
  }

  agent.events.on(RepositoryEventTypes.RecordUpdated, mediaSharingMetadataUpdateListener)
  agent.events.on(MediaSharingEventTypes.StateChanged, mediaSharingCreationEventListener)
  agent.events.on(AgentEventTypes.AgentMessageSent, agentMessageSentEventListener)
  agent.events.on(ReceiptsEventTypes.MessageReceiptsReceived, messageReceiptsReceivedListener)
  agent.events.on(ReactionsEventTypes.MessageReactionsReceived, messageReactionsReceivedListener)
  agent.events.on(AgentEventTypes.AgentMessageProcessed, agentMessageProcessedListener)
  agent.events.on(OutOfBandInvitationEventTypes.OutOfBandInvitationEvent, oobListener)
  agent.events.on(ProfileEventTypes.ConnectionProfileUpdated, connectionProfileListener)

  return () => {
    agent.events.off(RepositoryEventTypes.RecordUpdated, mediaSharingMetadataUpdateListener)
    agent.events.off(MediaSharingEventTypes.StateChanged, mediaSharingCreationEventListener)
    agent.events.off(AgentEventTypes.AgentMessageSent, agentMessageSentEventListener)
    agent.events.off(ReceiptsEventTypes.MessageReceiptsReceived, messageReceiptsReceivedListener)
    agent.events.off(ReactionsEventTypes.MessageReactionsReceived, messageReactionsReceivedListener)
    agent.events.off(AgentEventTypes.AgentMessageProcessed, agentMessageProcessedListener)
    agent.events.off(OutOfBandInvitationEventTypes.OutOfBandInvitationEvent, oobListener)
    agent.events.off(ProfileEventTypes.ConnectionProfileUpdated, connectionProfileListener)
  }
}
