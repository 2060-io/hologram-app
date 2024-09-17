import type { MessageHandler, MessageHandlerInboundMessage } from '@credo-ts/core'

import { CallAcceptMessage } from '../messages/CallAcceptMessage'

/**
 * Handler for incoming call accept messages
 */
export class CallAcceptHandler implements MessageHandler {
  public supportedMessages = [CallAcceptMessage]

  /**
  /* We don't really need to do anything with this at the moment
  /* The result can be hooked into through the generic message processed event
   */
  public async handle(inboundMessage: MessageHandlerInboundMessage<CallAcceptHandler>) {
    inboundMessage.assertReadyConnection()
  }
}
