import { AgentMessageSentEvent, AgentEventTypes, MessageSendingError } from '@credo-ts/core'
import { Realm } from 'realm'
import { ReplaySubject, firstValueFrom, filter, first, timeout, catchError, map } from 'rxjs'

import { ActionExecutionStatus, AgentAction, OutboundMessageContextData } from './AgentAction'
import { AgentActionExecuterMap } from './AgentActionExecuterMap'

import { updateChatEntry } from '@2060/hooks/agent/chat/services/ChatEntryService'
import { ChatEntry, ChatEntryState } from '@2060/model'
import { MobileAgent } from '@2060/services/agent'
import { log, logError } from '@2060/utils'

export class AgentActionExecuter {
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
    log('Execute Agent Action', JSON.stringify(action))

    const chatEntry = action.chatEntryId
      ? realm.objectForPrimaryKey(ChatEntry, action.chatEntryId)
      : undefined

    // Start looking at AgentMessageSent events
    const subscription = agent.events
      .observable<AgentMessageSentEvent>(AgentEventTypes.AgentMessageSent)
      .subscribe(replaySubject)

    try {
      const callback = AgentActionExecuterMap[action.type](action)
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
        logError(`Agent Action Error Sending Message Type ${action.type}: ${JSON.stringify(error)}`)
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
        logError('Agent Action Executer Error', error)
        throw error
      }
    } finally {
      subscription.unsubscribe()
    }
  }
}
