import {
  OutboundMessageContext,
  AgentContext,
  ConnectionService,
  injectable,
  MessageSender,
  CredoError,
  MessageHandlerRegistry,
} from '@credo-ts/core'

import { DidCommReactionsService } from './DidCommReactionsService'
import { MessageReactionsHandler } from './handlers'
import { MessageReaction, MessageReactionOptions } from './messages/MessageReactionsMessage'

@injectable()
export class DidCommReactionsApi {
  private messageSender: MessageSender
  private reactionsService: DidCommReactionsService
  private connectionService: ConnectionService
  private agentContext: AgentContext

  public constructor(
    messageHandlerRegistry: MessageHandlerRegistry,
    messageSender: MessageSender,
    reactionsService: DidCommReactionsService,
    connectionService: ConnectionService,
    agentContext: AgentContext,
  ) {
    this.messageSender = messageSender
    this.reactionsService = reactionsService
    this.connectionService = connectionService
    this.agentContext = agentContext
    this.registerMessageHandlers(messageHandlerRegistry)
  }

  public async send(options: { connectionId: string; reactions: MessageReactionOptions[] }) {
    const connection = await this.connectionService.findById(this.agentContext, options.connectionId)

    if (!connection) {
      throw new CredoError(`Connection not found with id ${options.connectionId}`)
    }

    const message = await this.reactionsService.createReactionsMessage({
      reactions: options.reactions.map(item => new MessageReaction(item)),
    })

    await this.messageSender.sendMessage(
      new OutboundMessageContext(message, { agentContext: this.agentContext, connection }),
    )
  }

  private registerMessageHandlers(messageHandlerRegistry: MessageHandlerRegistry) {
    messageHandlerRegistry.registerMessageHandler(new MessageReactionsHandler(this.reactionsService))
  }
}
