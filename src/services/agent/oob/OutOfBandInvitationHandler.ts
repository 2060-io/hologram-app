import {
  MessageHandler,
  OutOfBandInvitation,
  MessageHandlerInboundMessage,
  EventEmitter,
} from '@credo-ts/core'

import { OutOfBandInvitationEvent, OutOfBandInvitationEventTypes } from './OutOfBandEvents'

import { getOutOfBandRecord } from './index'

export class OutOfBandInvitationHandler implements MessageHandler {
  public supportedMessages = [OutOfBandInvitation]

  public async handle(messageContext: MessageHandlerInboundMessage<OutOfBandInvitationHandler>) {
    const agentContext = messageContext.agentContext
    messageContext.assertReadyConnection()

    const { outOfBandRecord } = await getOutOfBandRecord(agentContext, {
      invitation: messageContext.message,
      parentConnectionId: messageContext.connection?.id,
    })
    // Emit event: OOB Invitation received
    agentContext.dependencyManager.resolve(EventEmitter).emit<OutOfBandInvitationEvent>(agentContext, {
      type: OutOfBandInvitationEventTypes.OutOfBandInvitationEvent,
      payload: {
        action: 'Received',
        // FIXME: should be clone() but it is not properly extracting services array in invitation
        outOfBandRecord: outOfBandRecord,
        connection: messageContext.connection,
      },
    })
  }
}
