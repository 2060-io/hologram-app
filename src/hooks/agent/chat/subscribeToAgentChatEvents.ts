import { CallOfferMessage } from '@2060.io/credo-ts-didcomm-calls'
import {
  MediaSharingEventTypes,
  MediaSharingRecord,
  MediaSharingState,
  MediaSharingStateChangedEvent,
  ShareMediaMessage,
} from '@2060.io/credo-ts-didcomm-media-sharing'
import { MrzDataRequestMessage } from '@2060.io/credo-ts-didcomm-mrtd'
import { MessageReactionsReceivedEvent, ReactionsEventTypes } from '@2060.io/credo-ts-didcomm-reactions'
import {
  ReceiptsEventTypes,
  MessageReceiptsReceivedEvent,
  MessageState,
  MessageReceiptOptions,
  MessageReceipt,
} from '@2060.io/credo-ts-didcomm-receipts'
import { ConnectionProfileUpdatedEvent, ProfileEventTypes } from '@2060.io/credo-ts-didcomm-user-profile'
import { V1ProposeCredentialMessage } from '@credo-ts/anoncreds'
import {
  AgentEventTypes,
  AgentMessage,
  AgentMessageProcessedEvent,
  AgentMessageSentEvent,
  BasicMessage,
  ConnectionRecord,
  ConnectionType,
  OutOfBandInvitation,
  OutOfBandState,
  OutboundMessageSendStatus,
  RecordUpdatedEvent,
  RepositoryEventTypes,
  V2ProposePresentationMessage,
  parseMessageType,
} from '@credo-ts/core'
import { tryParseDid } from '@credo-ts/core/build/modules/dids/domain/parse'
import { QuestionMessage, AnswerMessage } from '@credo-ts/question-answer'
import Realm from 'realm'

import { AgentActionType } from '../actions/AgentAction'
import { SendReceiptsParameters } from '../actions/types'

import { DidCommMessageDirection } from './DidCommMessageDirection'
import { handleCallMessages, handleMrtdMessages } from './messageHandlers'
import {
  handleBasicMessageRecordChanges,
  handleCredentialExchangeRecordChanges,
  handleProofExchangeRecordChanges,
  handleQuestionAnswerRecordChanges,
} from './recordChangeHandlers'
import { handleMediaSharingRecordChanges } from './recordChangeHandlers/handleMediaSharingRecordChanges'
import {
  addReceiptToRelatedEntries,
  createChatEntry,
  findAllByAssociatedMessageId,
  findAllByAssociatedRecordId,
  updateChatEntry,
} from './services/ChatEntryService'
import { addUnread, findChatThread, findOrCreateChatThread, updateThread } from './services/ChatThreadService'

import { ChatEntryType, ChatEntryRole, ChatEntryState, InvitationMetadata } from '@2060/model'
import { InvitationState } from '@2060/model/InvitationState'
import { AgentActionQueueSingleton } from '@2060/services/AgentActionQueueSingleton'
import AgentSingleton from '@2060/services/AgentSingleton'
import { MobileAgent } from '@2060/services/agent'
import {
  OutOfBandInvitationEvent,
  OutOfBandInvitationEventTypes,
} from '@2060/services/agent/oob/OutOfBandEvents'
import { logForProd } from '@2060/utils'
import {
  getConnectionDisplayName,
  getConnectionDisplayPicture,
  setLastTimeProfileReceived,
  supportsMessageReceipts,
} from '@2060/utils/connectionUtils'

let getActiveChatThreadId: () => string | undefined

/**
 * Subscribes to agent chat-related events and sets up corresponding event listeners
 * to handle chat entries and thread updates, message processing, media sharing, receipts,
 * reactions, and invitations.
 * This function ensures that only one subscription is active at a time and provides a cleanup function
 * to remove all event listeners when no longer needed.
 * @param agent - The mobile agent instance used for event subscriptions and data fetching.
 * @param realm - The Realm database instance for chat data persistence and updates.
 * @param forceRefreshFunctionReference - If true, sets the active chat thread ID getter to the provided
 *  function
 * @param receivedGetActiveChatThreadId - A function that returns the currently active chat thread ID,
 * or undefined if none is active.
 * @returns A cleanup function that, when called, unsubscribes all event
 * listeners registered by this function.
 */
export function subscribeToAgentChatEvents(
  agent: MobileAgent,
  realm: Realm,
  forceRefreshFunctionReference: boolean,
  receivedGetActiveChatThreadId: () => string | undefined,
) {
  getActiveChatThreadId = forceRefreshFunctionReference ? receivedGetActiveChatThreadId : () => undefined
  const mobileAgentInstance = AgentSingleton.instance
  if (mobileAgentInstance.getIsAppSubscribedToEvents()) {
    logForProd('From main flow App is already subscribed to agent events')
    return
  }
  logForProd('Subscribing app to agent chat events...')
  mobileAgentInstance.setAppIsSubscribedToEvents(true)

  const connectionProfileListener = async (event: ConnectionProfileUpdatedEvent) => {
    const { connection } = event.payload
    setLastTimeProfileReceived(connection, agent.context)
    const thread = findChatThread(realm, connection)
    if (thread) {
      updateThread(realm, thread.id, {
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
        activeChatThreadId: getActiveChatThreadId(),
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
        activeChatThreadId: getActiveChatThreadId(),
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
        activeChatThreadId: getActiveChatThreadId(),
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
        activeChatThreadId: getActiveChatThreadId(),
        receivedAt,
        message,
      })
    }

    if (messageType.protocolName === V2ProposePresentationMessage.type.protocolName) {
      const [record] = await agent.proofs.findAllByQuery({ threadId: message.threadId })
      if (!record) return
      await handleProofExchangeRecordChanges({
        agent,
        realm,
        record,
        activeChatThreadId: getActiveChatThreadId(),
        receivedAt,
      })
    }

    if (messageType.protocolName === CallOfferMessage.type.protocolName) {
      handleCallMessages({
        realm,
        connection,
        activeChatThreadId: getActiveChatThreadId(),
        receivedAt,
        message,
        direction,
      })
    }
    if (messageType.protocolName === MrzDataRequestMessage.type.protocolName && connection) {
      handleMrtdMessages({
        realm,
        connection,
        activeChatThreadId: getActiveChatThreadId(),
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
        const entries = findAllByAssociatedRecordId(realm, associatedRecord.id)
        for (const entry of entries) {
          if (entry && entry.state === ChatEntryState.Created) {
            // Associate chat entry with the outbound message
            updateChatEntry(realm, {
              recordId: entry.id,
              state: ChatEntryState.Created,
              associatedMessageId: outboundMessage.message.id,
            })
          }
        }
      }
    }
  }

  // TODO: Use a dedicated method in chatEntryService for this, in order to set multiple entries
  // in a single write operation
  const messageReceiptsReceivedListener = async (data: MessageReceiptsReceivedEvent) => {
    const receipts = data.payload.receipts
    for (const receipt of receipts) {
      addReceiptToRelatedEntries(realm, receipt)
    }
  }

  const messageReactionsReceivedListener = async (data: MessageReactionsReceivedEvent) => {
    const reactions = data.payload.reactions

    realm.write(() => {
      for (const reaction of reactions) {
        const relatedEntries = findAllByAssociatedMessageId(realm, reaction.messageId)
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

    if (connection && supportsMessageReceipts(connection)) {
      const validMessagesTypesForReceipts = [
        QuestionMessage.type.messageTypeUri,
        AnswerMessage.type.messageTypeUri,
        BasicMessage.type.messageTypeUri,
        ShareMediaMessage.type.messageTypeUri,
        OutOfBandInvitation.type.messageTypeUri,
        V2ProposePresentationMessage.type.messageTypeUri,
      ]
      if (validMessagesTypesForReceipts.includes(data.payload.message.type)) {
        // Find associated thread and see if it's the active one
        const thread = findChatThread(realm, connection)

        // If message is part of current active chat thread, send it as viewed directly
        const state = thread.id === getActiveChatThreadId() ? MessageState.Viewed : MessageState.Received

        // TODO: Add to a queue and send receipts in a batch
        const receipt: MessageReceiptOptions = {
          messageId: data.payload.message.id,
          state,
          timestamp: new Date(),
        }
        addReceiptToRelatedEntries(realm, receipt as MessageReceipt)
        const parameters: SendReceiptsParameters = {
          connectionId: connection.id,
          receipts: [receipt],
        }
        const agentActionQueueSingleton = AgentActionQueueSingleton.instance
        agentActionQueueSingleton.configureQueue()
        agentActionQueueSingleton.addJob({ type: AgentActionType.SendReceipts, parameters }, true)
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
      const invitationEntries = findAllByAssociatedRecordId(
        realm,
        outOfBandRecord.id,
        ChatEntryType.Invitation,
      )

      for (const invitationEntry of invitationEntries) {
        // only update those entries that are not already marked as "replied"
        if (invitationEntry.metadata?.state === InvitationState.Received) {
          updateChatEntry(realm, {
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

    const thread = findOrCreateChatThread(realm, connection)
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
      createChatEntry(realm, {
        associatedRecordId: outOfBandRecord.id,
        chatThreadId: thread.id,
        type: ChatEntryType.Invitation,
        role: ChatEntryRole.Receiver,
        state: ChatEntryState.Received,
        metadata,
        createdAt: new Date().getTime(),
        associatedMessageId: event.payload.messageId,
      })
      if (thread.id !== getActiveChatThreadId()) {
        addUnread(realm, thread.id, 1)
      }
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
        activeChatThreadId: getActiveChatThreadId(),
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
      activeChatThreadId: getActiveChatThreadId(),
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
