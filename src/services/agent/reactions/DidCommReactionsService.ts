import { EventEmitter, InboundMessageContext } from '@credo-ts/core'
import { Lifecycle, scoped } from 'tsyringe'

import { MessageReactionsReceivedEvent, ReactionsEventTypes } from './DidcommReactionsEvents'
import { MessageReactionsMessageOptions, MessageReactionsMessage } from './messages'

@scoped(Lifecycle.ContainerScoped)
export class DidCommReactionsService {
  private eventEmitter: EventEmitter

  public constructor(eventEmitter: EventEmitter) {
    this.eventEmitter = eventEmitter
  }

  public async createReactionsMessage(options: MessageReactionsMessageOptions) {
    const message = new MessageReactionsMessage(options)

    return message
  }

  public async processReactions(messageContext: InboundMessageContext<MessageReactionsMessage>) {
    const { message } = messageContext
    const connection = messageContext.assertReadyConnection()

    this.eventEmitter.emit<MessageReactionsReceivedEvent>(messageContext.agentContext, {
      type: ReactionsEventTypes.MessageReactionsReceived,
      payload: {
        connectionId: connection.id,
        reactions: message.reactions,
      },
    })
  }
}
