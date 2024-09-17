import type { MessageHandler, MessageHandlerInboundMessage } from '@credo-ts/core'

import { CallOfferMessage } from '../messages/CallOfferMessage'

/**
 * Handler for incoming call offer messages
 */
export class CallOfferHandler implements MessageHandler {
  public supportedMessages = [CallOfferMessage]

  /**
  /* We don't really need to do anything with this at the moment
  /* The result can be hooked into through the generic message processed event
   */
  public async handle(inboundMessage: MessageHandlerInboundMessage<CallOfferHandler>) {
    inboundMessage.assertReadyConnection()
  }
}
