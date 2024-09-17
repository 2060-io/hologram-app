import type { MessageHandler, MessageHandlerInboundMessage } from '@credo-ts/core'

import { CallEndMessage } from '../messages/CallEndMessage'

/**
 * Handler for incoming call offer messages
 */
export class CallEndHandler implements MessageHandler {
  public supportedMessages = [CallEndMessage]

  /**
  /* We don't really need to do anything with this at the moment
  /* The result can be hooked into through the generic message processed event
   */
  public async handle(inboundMessage: MessageHandlerInboundMessage<CallEndHandler>) {
    inboundMessage.assertReadyConnection()
  }
}
