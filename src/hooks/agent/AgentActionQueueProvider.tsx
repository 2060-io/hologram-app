import { MediaSharingRecord } from '@2060.io/credo-ts-didcomm-media-sharing'
import { ActionMenuRecord, ActionMenuRepository } from '@credo-ts/action-menu'
import {
  AgentMessage,
  BaseRecord,
  BasicMessageRecord,
  JsonTransformer,
  MessageSender,
  getOutboundMessageContext,
} from '@credo-ts/core'
import React, { createContext, PropsWithChildren, useCallback, useContext, useEffect, useState } from 'react'
import queue, { Worker } from 'react-native-job-queue'

import { useLocalRealm } from '../providers/RealmProvider'
import { useNetwork } from '../useNetwork'

import { AgentActionExecuter } from './actions/AgentActionExecuter'

import {
  ActionExecutionStatus,
  AgentAction,
  AgentActionOptions,
  OutboundMessageContextData,
  RetryAgentAction,
  useMobileAgent,
} from './'

import { log, logError } from '@2060/utils'

class ActionExecutionError extends Error {
  public outboundMessageContextData?: OutboundMessageContextData
  constructor(message: string, outboundMessageContextData?: OutboundMessageContextData) {
    super(message)
    this.outboundMessageContextData = outboundMessageContextData
  }
}
type AgentActionQueueContextProps = {
  addAgentActionToQueue: (action: AgentActionOptions) => void
}

export const useAgentActionQueue = () => {
  const agentActionQueueContext = useContext(AgentActionQueueContext)
  if (!agentActionQueueContext) {
    throw new Error('useAgentActionQueue must be used within a AgentActionQueueProvider')
  }
  return agentActionQueueContext
}

const AgentActionQueueContext = createContext<AgentActionQueueContextProps | undefined>(undefined)

export const AgentActionQueueProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { realm } = useLocalRealm()
  const { agent } = useMobileAgent()
  const [isReady, setIsReady] = useState<boolean>(false)
  const { assertConnectedNetwork } = useNetwork()
  const isNetworkConnected = assertConnectedNetwork()

  useEffect(() => {
    if (isNetworkConnected) {
      if (isReady) queue.start()
    } else {
      queue.stop()
    }
  }, [isNetworkConnected, isReady])

  useEffect(() => {
    if (!realm || !agent || isReady) return

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
              }, 2000)
            }
          },
        },
      ),
    )

    const getAssociatedRecord = async (options: { recordType: string; recordId: string }) => {
      const { recordType, recordId } = options
      if (recordType === BasicMessageRecord.type) return agent.basicMessages.getById(recordId)
      if (recordType === MediaSharingRecord.type) return agent.modules.media.findById(recordId)
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

          const messageSender = agent.dependencyManager.resolve(MessageSender)

          const connectionRecord = payload.outboundMessageContextData.didcommConnectionId
            ? await agent.connections.getById(payload.outboundMessageContextData.didcommConnectionId)
            : undefined

          try {
            log('sending retry message')

            let associatedRecord: BaseRecord | null | undefined
            if (payload.outboundMessageContextData.associatedRecord) {
              const { id: recordId, type: recordType } = payload.outboundMessageContextData.associatedRecord
              associatedRecord = await getAssociatedRecord({ recordId, recordType })
            }

            await messageSender.sendMessage(
              await getOutboundMessageContext(agent.context, {
                message: JsonTransformer.fromJSON(payload.outboundMessageContextData.message, AgentMessage),
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
              }, 2000)
            }
          },
        },
      ),
    )
    setIsReady(true)
  }, [agent, realm])

  const addAgentActionToQueue = useCallback(
    (action: AgentActionOptions) => {
      const attempts = 4 // TODO: Define a default
      queue.addJob('AgentAction', { ...action, attempts }, undefined, isNetworkConnected)
    },
    [realm, agent, isNetworkConnected],
  )

  return <AgentActionQueueContext value={{ addAgentActionToQueue }}>{children}</AgentActionQueueContext>
}
