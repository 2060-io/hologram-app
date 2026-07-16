import { DidCommMediaSharingRecord } from '@2060.io/credo-ts-didcomm-media-sharing'
import { ActionMenuRecord, ActionMenuRepository } from '@credo-ts/action-menu'
import { BaseRecord, JsonTransformer } from '@credo-ts/core'
import {
  DidCommBasicMessageRecord,
  DidCommMessage,
  DidCommMessageSender,
  getOutboundDidCommMessageContext,
} from '@credo-ts/didcomm'
import {
  ActionExecutionStatus,
  AgentAction,
  AgentActionOptions,
  OutboundMessageContextData,
  RetryAgentAction,
} from '@src/hooks/agent/actions/AgentAction'
import { AgentActionExecuter } from '@src/hooks/agent/actions/AgentActionExecuter'
import { updateChatEntry } from '@src/hooks/agent/chat/services'
import { ChatEntry, ChatEntryState } from '@src/model'
import { log, logError } from '@src/utils'
import queue, { Worker } from 'react-native-job-queue'
import AgentSingleton from './AgentSingleton'
import RealmSingleton from './RealmSingleton'

// Hard ceilings enforced by `react-native-job-queue`. If the executer promise
// doesn't settle within these, the library rejects the job via Promise.race,
// preventing a stuck job from halting the (concurrency=1) queue indefinitely.
// The values are larger than the internal timeouts in `AgentActionExecuter` so
// those can fire first and produce cleaner errors.
const AGENT_ACTION_JOB_TIMEOUT_MS = 90_000
const RETRY_ACTION_JOB_TIMEOUT_MS = 60_000

// Per-retry hard ceiling around `DidCommMessageSender.sendMessage`. Without
// this, a hung outbound transport would block the queue until the process is
// killed (the library timeout above is the last-resort safety net).
const RETRY_SEND_MESSAGE_TIMEOUT_MS = 45_000

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

class ActionExecutionError extends Error {
  public outboundMessageContextData?: OutboundMessageContextData
  constructor(message: string, outboundMessageContextData?: OutboundMessageContextData) {
    super(message)
    this.outboundMessageContextData = outboundMessageContextData
  }
}

export class AgentActionQueueSingleton {
  private static agentActionQueueInstance: AgentActionQueueSingleton
  private isConfigured = false

  static get instance() {
    if (!AgentActionQueueSingleton.agentActionQueueInstance) {
      AgentActionQueueSingleton.agentActionQueueInstance = new AgentActionQueueSingleton()
    }
    return AgentActionQueueSingleton.agentActionQueueInstance
  }

  configureQueue() {
    if (this.isConfigured) return
    const realm = RealmSingleton.instance.getRealm()
    if (!realm) throw new Error('Realm is not open yet. You must openRealmIfIsClosed first')
    const agent = AgentSingleton.instance.getMobileAgent()
    if (!agent?.isInitialized) {
      throw new Error('Agent is not initialized yet. You must setupMobileAgent and openAndInitMobileAgent first')
    }

    for (const worker in queue.registeredWorkers) {
      queue.removeWorker(worker)
    }

    queue.configure({
      concurrency: 1,
      updateInterval: 200,
    })
    const runner = new AgentActionExecuter()

    queue.addWorker(
      new Worker<AgentAction>(
        'AgentAction',
        async (payload: AgentAction) => {
          const result = await runner.execute({ agent, realm, action: payload })
          if (result.status === ActionExecutionStatus.Failed) {
            throw new ActionExecutionError('Execution error', result.outboundMessageContextData)
          }
        },
        {
          onFailure(job, error) {
            if (error instanceof ActionExecutionError) {
              const remainingAttempts = job.payload.attempts - 1
              if (remainingAttempts < 1) return

              const retryAction = {
                outboundMessageContextData: error.outboundMessageContextData,
                remainingAttempts,
              } as RetryAgentAction

              // Synchronous enqueue: if we delay via setTimeout, the retry is
              // lost when the OS suspends/kills the process before it fires.
              queue.addJob<RetryAgentAction>(
                'RetryAgentAction',
                retryAction,
                { attempts: 0, timeout: RETRY_ACTION_JOB_TIMEOUT_MS, priority: 0 },
                false
              )
            } else {
              logError(`AgentAction ${job.payload.type} failed unrecoverably: ${error}`)
            }
          },
        }
      )
    )

    const getAssociatedRecord = async (options: { recordType: string; recordId: string }) => {
      const { recordType, recordId } = options
      if (recordType === DidCommBasicMessageRecord.type) return agent.didcomm.basicMessages.getById(recordId)
      if (recordType === DidCommMediaSharingRecord.type) return agent.modules.media.findById(recordId)
      if (recordType === ActionMenuRecord.type) {
        return agent.dependencyManager.resolve(ActionMenuRepository).findById(agent.context, recordId)
      }
      return undefined
    }

    queue.addWorker(
      new Worker<RetryAgentAction>(
        'RetryAgentAction',
        async (payload: RetryAgentAction) => {
          if (!payload.outboundMessageContextData) {
            throw Error('No outbound message context data for this action')
          }

          const messageSender = agent.dependencyManager.resolve(DidCommMessageSender)

          const connectionRecord = payload.outboundMessageContextData.didcommConnectionId
            ? await agent.didcomm.connections.getById(payload.outboundMessageContextData.didcommConnectionId)
            : undefined

          try {
            log('sending retry message')

            let associatedRecord: BaseRecord | null | undefined
            if (payload.outboundMessageContextData.associatedRecord) {
              const { id: recordId, type: recordType } = payload.outboundMessageContextData.associatedRecord
              associatedRecord = await getAssociatedRecord({ recordId, recordType })
            }

            await withTimeout(
              messageSender.sendMessage(
                await getOutboundDidCommMessageContext(agent.context, {
                  message: JsonTransformer.fromJSON(payload.outboundMessageContextData.message, DidCommMessage),
                  associatedRecord: associatedRecord ?? undefined,
                  connectionRecord,
                })
              ),
              RETRY_SEND_MESSAGE_TIMEOUT_MS,
              'RetryAgentAction sendMessage'
            )
            const associatedChatEntryId = payload.outboundMessageContextData.associatedChatEntryId
            const chatEntry = associatedChatEntryId
              ? realm.objectForPrimaryKey(ChatEntry, associatedChatEntryId)
              : undefined
            // Message is submitted: update the associated chat entry to the corresponding state
            if (chatEntry && chatEntry.state === ChatEntryState.Created) {
              updateChatEntry(realm, { recordId: chatEntry.id, state: ChatEntryState.Submitted })
            }
          } catch (error) {
            logError(`error trying resending message: ${error}`)
            throw new ActionExecutionError('Execution error', payload.outboundMessageContextData)
          }
        },
        {
          onFailure(job, error) {
            if (error instanceof ActionExecutionError) {
              const remainingAttempts = job.payload.remainingAttempts - 1
              if (remainingAttempts < 1) {
                logError('retry message error. No more attempts left')
                return
              }

              logError('retry message error. re-adding to queue')
              const newRetryAction = {
                outboundMessageContextData: error.outboundMessageContextData,
                remainingAttempts,
              } as RetryAgentAction

              // Synchronous enqueue so the retry survives the app being killed
              // before a setTimeout could fire.
              queue.addJob<RetryAgentAction>(
                'RetryAgentAction',
                newRetryAction,
                { attempts: 0, timeout: RETRY_ACTION_JOB_TIMEOUT_MS, priority: 0 },
                false
              )
            } else {
              logError(`RetryAgentAction failed unrecoverably: ${error}`)
            }
          },
        }
      )
    )
    this.isConfigured = true
    // Kick the queue as soon as it is configured. `start()` is idempotent (it
    // no-ops if already active), so this protects against the provider's
    // network-gated effect racing with `setIsReady(true)` and never issuing a
    // `start()`.
    queue.start()
  }

  getQueue() {
    return queue
  }

  /**
   * Drop the current configuration after agent/realm teardown (e.g. wallet
   * deletion). Stops the queue and removes workers so no stale closure keeps
   * references to the old agent/realm. Pending jobs are kept in the persistent
   * store: a subsequent `configureQueue()` will resume them against the new
   * agent instance.
   */
  reset() {
    queue.stop()
    for (const worker of Object.keys(queue.registeredWorkers)) {
      queue.removeWorker(worker)
    }
    this.isConfigured = false
  }

  setIsConfigured(isConfigured: boolean) {
    this.isConfigured = isConfigured
  }

  /**
   * Diagnostic helper: returns the persisted job list. Useful from the
   * Developer panel to inspect stuck queues in production builds.
   */
  async getPendingJobs() {
    return queue.getJobs()
  }

  addJob(payload: AgentActionOptions, startQueue: boolean = true) {
    queue.addJob(
      'AgentAction',
      { ...payload, attempts: 4 },
      { attempts: 0, timeout: AGENT_ACTION_JOB_TIMEOUT_MS, priority: 0 },
      startQueue
    )
  }
}
