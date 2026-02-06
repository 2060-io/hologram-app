import { DidCommMediaSharingRecord } from '@2060.io/credo-ts-didcomm-media-sharing'
import { ActionMenuRecord, ActionMenuRepository } from '@credo-ts/action-menu'
import { BaseRecord, JsonTransformer } from '@credo-ts/core'
import {
  DidCommMessage,
  DidCommBasicMessageRecord,
  DidCommMessageSender,
  getOutboundDidCommMessageContext,
} from '@credo-ts/didcomm'
import queue, { Worker } from 'react-native-job-queue'

import AgentSingleton from './AgentSingleton'
import RealmSingleton from './RealmSingleton'

import {
  ActionExecutionStatus,
  AgentAction,
  AgentActionOptions,
  OutboundMessageContextData,
  RetryAgentAction,
} from '@2060/hooks/agent/actions/AgentAction'
import { AgentActionExecuter } from '@2060/hooks/agent/actions/AgentActionExecuter'
import { log, logError } from '@2060/utils'

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
    if (!this.agentActionQueueInstance) {
      this.agentActionQueueInstance = new AgentActionQueueSingleton()
    }
    return this.agentActionQueueInstance
  }

  configureQueue() {
    if (this.isConfigured) return
    const realm = RealmSingleton.instance.getRealm()
    if (!realm) throw new Error('Realm is not open yet. You must openRealmIfIsClosed first')
    const agent = AgentSingleton.instance.getMobileAgent()
    if (!agent?.isInitialized) {
      throw new Error(
        'Agent is not initialized yet. You must setupMobileAgent and openAndInitMobileAgent first',
      )
    }

    for (const worker in queue.registeredWorkers) {
      queue.removeWorker(worker)
    }

    queue.configure({
      concurrency: 1,
      updateInterval: 5,
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

              setTimeout(() => {
                queue.addJob<RetryAgentAction>('RetryAgentAction', retryAction, undefined, false)
              }, 2_000)
            }
          },
        },
      ),
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

            await messageSender.sendMessage(
              await getOutboundDidCommMessageContext(agent.context, {
                message: JsonTransformer.fromJSON(payload.outboundMessageContextData.message, DidCommMessage),
                associatedRecord: associatedRecord ?? undefined,
                connectionRecord,
              }),
            )
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

              setTimeout(() => {
                queue.addJob<RetryAgentAction>('RetryAgentAction', newRetryAction, undefined, false)
              }, 2_000)
            }
          },
        },
      ),
    )
    this.isConfigured = true
  }

  getQueue() {
    return queue
  }

  setIsConfigured(isConfigured: boolean) {
    this.isConfigured = isConfigured
  }

  addJob(payload: AgentActionOptions, startQueue: boolean = true) {
    queue.addJob('AgentAction', { ...payload, attempts: 4 }, undefined, startQueue)
  }
}
