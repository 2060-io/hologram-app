import { EventEmitter } from '@credo-ts/core'
import {
  DidCommMessageHandler,
  DidCommOutOfBandInvitation,
  DidCommMessageHandlerInboundMessage,
} from '@credo-ts/didcomm'

import { OutOfBandInvitationEvent, OutOfBandInvitationEventTypes } from './OutOfBandEvents'

import { getOutOfBandRecord } from './index'

export class DidCommOutOfBandInvitationHandler implements DidCommMessageHandler {
  public supportedMessages = [DidCommOutOfBandInvitation]

  public async handle(
    messageContext: DidCommMessageHandlerInboundMessage<DidCommOutOfBandInvitationHandler>,
  ): Promise<undefined> {
    const agentContext = messageContext.agentContext
    messageContext.assertReadyConnection()

    const { outOfBandRecord } = await getOutOfBandRecord(agentContext, {
      invitation: messageContext.message,
    })
    // Emit event: OOB Invitation received
    agentContext.dependencyManager.resolve(EventEmitter).emit<OutOfBandInvitationEvent>(agentContext, {
      type: OutOfBandInvitationEventTypes.OutOfBandInvitationEvent,
      payload: {
        action: 'Received',
        // FIXME: should be clone() but it is not properly extracting services array in invitation
        outOfBandRecord: outOfBandRecord,
        connection: messageContext.connection,
        messageId: messageContext.message.id,
      },
    })
  }
}
