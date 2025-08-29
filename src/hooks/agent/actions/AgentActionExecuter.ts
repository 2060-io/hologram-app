import { ShareMediaMessage } from '@2060.io/credo-ts-didcomm-media-sharing'
import { MessageReactionsMessage, MessageReactionAction } from '@2060.io/credo-ts-didcomm-reactions'
import { MessageReceiptsMessage, MessageState } from '@2060.io/credo-ts-didcomm-receipts'
import { PerformMessage } from '@credo-ts/action-menu'
import {
  BaseRecord,
  AgentMessageSentEvent,
  AgentEventTypes,
  MessageSendingError,
  BasicMessage,
  MessageSender,
  OutboundMessageContext,
  OutOfBandInvitation,
  V2ProposePresentationMessage,
  DidExchangeResponseMessage,
} from '@credo-ts/core'
import { AnswerMessage } from '@credo-ts/question-answer'
import { Realm } from 'realm'
import { ReplaySubject, firstValueFrom, filter, first, timeout, catchError, map } from 'rxjs'

import {
  ActionExecutionStatus,
  AgentAction,
  AgentActionType,
  OutboundMessageContextData,
} from './AgentAction'

import { updateChatEntry } from '@2060/hooks/agent/chat/services/ChatEntryService'
import { ChatEntry, ChatEntryState } from '@2060/model'
import { createOobInvitation, MobileAgent } from '@2060/services/agent'
import { log, logError } from '@2060/utils'

type ActionCallback = (options: { agent: MobileAgent }) => Promise<AgentCallbackReturnType<BaseRecord>>

export type AnoncredsAttribute = {
  name: string
  credentialDefinitionId: string
}

export class AgentActionExecuter {
  private getCallbackForAction(action: AgentAction): ActionCallback {
    if (action.type === AgentActionType.SendTextMessage) {
      const parameters = action.parameters as {
        text: string
        chatThreadId: string
        didcommThreadId: string
        didcommConnectionId: string
      }

      const { text, didcommThreadId, didcommConnectionId } = parameters

      return async (options: { agent: MobileAgent }) => {
        const record = await options.agent.basicMessages.sendMessage(
          didcommConnectionId,
          text,
          didcommThreadId,
        )

        return {
          associatedRecord: record,
          outgoingMessageType: BasicMessage.type.messageTypeUri,
        }
      }
    } else if (action.type === AgentActionType.SendReaction) {
      const parameters = action.parameters as {
        didcommConnectionId: string
        didcommReactions: {
          messageId: string
          action: MessageReactionAction
          emoji: string
        }[]
      }

      const { didcommConnectionId, didcommReactions } = parameters

      return async (options: { agent: MobileAgent }) => {
        await options.agent.modules.reactions.send({
          connectionId: didcommConnectionId,
          reactions: didcommReactions,
        })
        return { outgoingMessageType: MessageReactionsMessage.type.messageTypeUri }
      }
    } else if (action.type === AgentActionType.SendReceipts) {
      const parameters = action.parameters as {
        didcommConnectionId: string
        receipts: {
          messageId: string
          state: MessageState
          timestamp?: number
        }[]
      }

      const { didcommConnectionId, receipts } = parameters
      return async (options: { agent: MobileAgent }) => {
        await options.agent.modules.receipts.send({
          connectionId: didcommConnectionId,
          receipts: receipts.map(item => ({
            messageId: item.messageId,
            state: item.state,
            timestamp: item.timestamp ? new Date(item.timestamp) : new Date(),
          })),
        })
        return { outgoingMessageType: MessageReceiptsMessage.type.messageTypeUri }
      }
    } else if (action.type === AgentActionType.ShareMedia) {
      const parameters = action.parameters as {
        recordId: string
      }

      const { recordId } = parameters

      return async (options: { agent: MobileAgent }) => {
        await options.agent.modules.media.share({ recordId })
        return { outgoingMessageType: ShareMediaMessage.type.messageTypeUri }
      }
    } else if (action.type === AgentActionType.ActionMenuSelection) {
      const parameters = action.parameters as {
        didcommConnectionId: string
        selectedItemName: string
      }

      const { selectedItemName, didcommConnectionId } = parameters

      return async (options: { agent: MobileAgent }) => {
        await options.agent.modules.actionMenu.performAction({
          connectionId: didcommConnectionId,
          performedAction: { name: selectedItemName },
        })

        return { outgoingMessageType: PerformMessage.type.messageTypeUri }
      }
    } else if (action.type === AgentActionType.ForwardConnection) {
      const parameters = action.parameters as {
        forwardedConnectionId: string
        didcommConnectionId: string
      }
      const { forwardedConnectionId, didcommConnectionId } = parameters
      return async (options: { agent: MobileAgent }) => {
        const originDidcommConnection = await options.agent?.connections.getById(forwardedConnectionId)
        const outOfBandInvitation = createOobInvitation(originDidcommConnection)
        const didcommConnection = await options.agent?.connections.getById(didcommConnectionId)
        const messageSender = options.agent?.context.dependencyManager.resolve(MessageSender)
        await messageSender.sendMessage(
          new OutboundMessageContext(outOfBandInvitation, {
            agentContext: options.agent?.context,
            connection: didcommConnection,
          }),
        )
        return { outgoingMessageType: OutOfBandInvitation.type.messageTypeUri }
      }
    } else if (action.type === AgentActionType.PresentCredential) {
      const parameters = action.parameters as {
        didcommConnectionId: string
        anoncredsAttributes: AnoncredsAttribute[]
      }
      const { didcommConnectionId, anoncredsAttributes } = parameters
      return async (options: { agent: MobileAgent }) => {
        const proofExchangeRecord = await options.agent.proofs.proposeProof({
          proofFormats: { anoncreds: { attributes: anoncredsAttributes } },
          connectionId: didcommConnectionId,
          protocolVersion: 'v2',
        })
        return {
          outgoingMessageType: V2ProposePresentationMessage.type.messageTypeUri,
          associatedRecord: proofExchangeRecord,
        }
      }
    } else if (action.type === AgentActionType.SendAnswer) {
      const parameters = action.parameters as {
        response: string
        associatedRecordId: string
      }
      const { response, associatedRecordId } = parameters
      return async (options: { agent: MobileAgent }) => {
        const associatedRecord = await options.agent.modules.questionAnswer.sendAnswer(
          associatedRecordId,
          response,
        )
        return {
          outgoingMessageType: AnswerMessage.type.messageTypeUri,
          associatedRecord,
        }
      }
    } else if (action.type === AgentActionType.AcceptConnectionRequest) {
      const parameters = action.parameters as {
        connectionId: string
      }
      const { connectionId } = parameters
      return async (options: { agent: MobileAgent }) => {
        await options.agent.connections.acceptRequest(connectionId)
        return {
          outgoingMessageType: DidExchangeResponseMessage.type.messageTypeUri,
        }
      }
    }
    logError(`No callback for type ${action.type}`)
    throw new Error(`Execution callback not defined for action of type ${action.type}`)
  }

  /**
   * @param callback action to be executed. Might return a record id to associate an outgoing message
   *
   * @returns
   */
  public async execute(options: {
    agent: MobileAgent
    realm: Realm
    action: AgentAction
  }): Promise<{ status: ActionExecutionStatus; outboundMessageContextData?: OutboundMessageContextData }> {
    const { agent, realm, action } = options
    const replaySubject = new ReplaySubject<AgentMessageSentEvent>()
    log(`Execute action: ${JSON.stringify(action)}`)

    const callback = this.getCallbackForAction(action)
    const chatEntry = action.chatEntryId
      ? realm.objectForPrimaryKey(ChatEntry, action.chatEntryId)
      : undefined

    // Start looking at AgentMessageSent events
    const subscription = agent.events
      .observable<AgentMessageSentEvent>(AgentEventTypes.AgentMessageSent)
      .subscribe(replaySubject)

    try {
      const { associatedRecord, outgoingMessageType } = await callback({ agent })

      // Wait until the outgoing message has been submitted and update the chat entry accordingly
      const message = await firstValueFrom(
        replaySubject.asObservable().pipe(
          filter(
            e => outgoingMessageType === undefined || e.payload.message.message.type === outgoingMessageType,
          ),
          filter(
            e =>
              associatedRecord === undefined ||
              e.payload.message.associatedRecord?.id === associatedRecord.id,
          ),
          first(),
          timeout(5000),
          catchError(() => {
            // TODO: Catch timeout error and add to queue
            throw new Error('AgentMessageSent event not emitted within timeout')
          }),
          map(e => e.payload.message),
        ),
      )

      // Message is submitted: update the associated chat entry to the corresponding state
      if (chatEntry && chatEntry.state === ChatEntryState.Created) {
        updateChatEntry(realm, {
          recordId: chatEntry.id,
          state: ChatEntryState.Submitted,
          associatedMessageId: message.message.id,
          associatedRecordId: associatedRecord?.id,
        })
      }
      return { status: ActionExecutionStatus.OK }
    } catch (error) {
      if (error instanceof MessageSendingError) {
        log(`**** Message sending error: ${JSON.stringify(error)}`)
        const { message, associatedRecord, connection } = error.outboundMessageContext

        // Message failed to be sent. However we can already associate it to the chat entry
        if (chatEntry && chatEntry.state === ChatEntryState.Created) {
          updateChatEntry(realm, {
            recordId: chatEntry.id,
            state: chatEntry.state, // state will not change, since the message was not submitted
            associatedMessageId: message.id,
            associatedRecordId: associatedRecord?.id,
          })
        }

        return {
          status: ActionExecutionStatus.Failed,
          outboundMessageContextData: {
            message: message.toJSON(),
            associatedChatEntryId: chatEntry?.id,
            associatedRecord: associatedRecord
              ? { type: associatedRecord.type, id: associatedRecord.id }
              : undefined,
            didcommConnectionId: connection?.id,
          },
        }
      } else {
        log(`unexpected error: ${error}`)

        throw error
      }
    } finally {
      subscription.unsubscribe()
    }
  }
}

type AgentCallbackReturnType<T extends BaseRecord = BaseRecord> = {
  associatedRecord?: T
  outgoingMessageType: string
}
