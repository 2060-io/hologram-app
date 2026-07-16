import { DidCommEventTypes, DidCommMessageSentEvent, MessageSendingError } from '@credo-ts/didcomm'
import { updateChatEntry } from '@src/hooks/agent/chat/services/ChatEntryService'
import { ChatEntry, ChatEntryState } from '@src/model'
import { MobileAgent } from '@src/services/agent'
import { log, logError } from '@src/utils'
import { Realm } from 'realm'
import { catchError, filter, first, firstValueFrom, map, ReplaySubject, timeout } from 'rxjs'
import { ActionExecutionStatus, AgentAction, OutboundMessageContextData } from './AgentAction'
import { AgentActionExecuterMap } from './AgentActionExecuterMap'

// Hard ceiling for the action callback itself (i.e. the underlying `sendMessage`
// dispatching logic). If the outbound transport hangs (dead socket, stalled
// upload, mediator WS half-open), this timeout ensures the worker resolves so
// that `react-native-job-queue` can move on instead of leaving the queue stuck.
const ACTION_CALLBACK_TIMEOUT_MS = 45_000

// Time we wait for the `DidCommMessageSent` event after the callback resolves.
// Bumped from 5s because large media uploads and slow networks commonly exceed
// that on mobile.
const MESSAGE_SENT_EVENT_TIMEOUT_MS = 30_000

// Maximum serialized size of the outbound message we are willing to persist in
// the job store for retry. Beyond this, repeated failures would bloat the
// SQLite-backed job queue and, historically, could leave users with a queue
// they could only recover from by wiping all app data. Dropping retries for
// oversized payloads is safer than risking a permanent stall.
const MAX_RETRY_MESSAGE_JSON_BYTES = 256 * 1024

const withTimeout = <T>(promise: Promise<T>, ms: number, label: string): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (err) => {
        clearTimeout(timer)
        reject(err)
      }
    )
  })

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
    const replaySubject = new ReplaySubject<DidCommMessageSentEvent>()
    log('Execute Agent Action', JSON.stringify(action))

    const chatEntry = action.chatEntryId ? realm.objectForPrimaryKey(ChatEntry, action.chatEntryId) : undefined

    // Start looking at AgentMessageSent events
    const subscription = agent.events
      .observable<DidCommMessageSentEvent>(DidCommEventTypes.DidCommMessageSent)
      .subscribe(replaySubject)

    try {
      const callback = AgentActionExecuterMap[action.type](action)
      const { associatedRecord, outgoingMessageTypes } = await withTimeout(
        callback({ agent }),
        ACTION_CALLBACK_TIMEOUT_MS,
        `Agent action ${action.type} callback`
      )

      // Wait until the outgoing message has been submitted and update the chat entry accordingly
      const message = await firstValueFrom(
        replaySubject.asObservable().pipe(
          filter((e) => !outgoingMessageTypes?.length || outgoingMessageTypes.includes(e.payload.message.message.type)),
          filter(
            (e) => associatedRecord === undefined || e.payload.message.associatedRecord?.id === associatedRecord.id
          ),
          first(),
          timeout(MESSAGE_SENT_EVENT_TIMEOUT_MS),
          catchError(() => {
            // The callback resolved without throwing `MessageSendingError`, so the
            // message most likely has been (or is being) sent. Retrying would risk
            // duplicate sends, so we surface a non-retryable error and let the
            // queue move on. The chat entry will stay in `Created` until further
            // reconciliation.
            throw new Error(`DidCommMessageSent not emitted in ${MESSAGE_SENT_EVENT_TIMEOUT_MS}ms (${action.type})`)
          }),
          map((e) => e.payload.message)
        )
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

        const messageJson = message.toJSON()
        const serializedSize = JSON.stringify(messageJson).length
        if (serializedSize > MAX_RETRY_MESSAGE_JSON_BYTES) {
          logError(
            `Outbound message for ${action.type} is ${serializedSize} bytes, ` +
              `above the ${MAX_RETRY_MESSAGE_JSON_BYTES}-byte retry cap; dropping retries.`
          )
          // Return OK so no retry is enqueued. The chat entry stays in `Created`
          // and the caller can surface it as an unsent message in the UI.
          return { status: ActionExecutionStatus.OK }
        }

        return {
          status: ActionExecutionStatus.Failed,
          outboundMessageContextData: {
            message: messageJson,
            associatedChatEntryId: chatEntry?.id,
            associatedRecord: associatedRecord ? { type: associatedRecord.type, id: associatedRecord.id } : undefined,
            didcommConnectionId: connection?.id,
          },
        }
      } else {
        logError(`Agent Action Executer Error: ${JSON.stringify(error)}`)
        throw error
      }
    } finally {
      subscription.unsubscribe()
    }
  }
}
