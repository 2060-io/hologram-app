import {
  OutboundMessageContext,
  AgentContext,
  ConnectionService,
  injectable,
  MessageSender,
} from '@credo-ts/core'

import { DidCommCallsService } from './DidCommCallsService'
import { DidCommCallType } from './messages/CallOfferMessage'

@injectable()
export class DidCommCallsApi {
  private messageSender: MessageSender
  private didcommCallsService: DidCommCallsService
  private connectionService: ConnectionService
  private agentContext: AgentContext

  public constructor(
    messageSender: MessageSender,
    didcommCallsService: DidCommCallsService,
    connectionService: ConnectionService,
    agentContext: AgentContext,
  ) {
    this.messageSender = messageSender
    this.didcommCallsService = didcommCallsService
    this.connectionService = connectionService
    this.agentContext = agentContext
  }

  public async offer(options: {
    connectionId: string
    callType: DidCommCallType
    parameters: Record<string, unknown>
  }) {
    const { connectionId, callType, parameters } = options
    const connection = await this.connectionService.getById(this.agentContext, connectionId)
    connection.assertReady()

    const message = this.didcommCallsService.createOffer({ callType, parameters })

    const outbound = new OutboundMessageContext(message, {
      agentContext: this.agentContext,
      connection: connection,
    })
    await this.messageSender.sendMessage(outbound)
  }

  public async accept(options: {
    connectionId: string
    threadId?: string
    parameters: Record<string, unknown>
  }) {
    const { connectionId, threadId, parameters } = options
    const connection = await this.connectionService.getById(this.agentContext, connectionId)
    connection.assertReady()

    const message = this.didcommCallsService.createAccept({ threadId, parameters })

    const outbound = new OutboundMessageContext(message, {
      agentContext: this.agentContext,
      connection: connection,
    })
    await this.messageSender.sendMessage(outbound)
  }

  public async reject(options: { connectionId: string; threadId?: string }) {
    const { connectionId, threadId } = options
    const connection = await this.connectionService.getById(this.agentContext, connectionId)
    connection.assertReady()

    const message = this.didcommCallsService.createReject({ threadId })

    const outbound = new OutboundMessageContext(message, {
      agentContext: this.agentContext,
      connection: connection,
    })
    await this.messageSender.sendMessage(outbound)
  }

  public async hangup(options: { connectionId: string; threadId?: string }) {
    const { connectionId, threadId } = options
    const connection = await this.connectionService.getById(this.agentContext, connectionId)
    connection.assertReady()

    const message = this.didcommCallsService.createEnd({ threadId })

    const outbound = new OutboundMessageContext(message, {
      agentContext: this.agentContext,
      connection: connection,
    })
    await this.messageSender.sendMessage(outbound)
  }
}
