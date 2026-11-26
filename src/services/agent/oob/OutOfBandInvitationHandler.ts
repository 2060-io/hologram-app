import { EventEmitter } from '@credo-ts/core'
import {
  DidCommMessageHandler,
  DidCommMessageHandlerInboundMessage,
  DidCommOutOfBandInvitation,
  DidCommOutOfBandRecord,
} from '@credo-ts/didcomm'
import { getOutOfBandRecord, UnsupportedDidcommVersionError } from './index'
import { OutOfBandInvitationEvent, OutOfBandInvitationEventTypes } from './OutOfBandEvents'

export class DidCommOutOfBandInvitationHandler implements DidCommMessageHandler {
  public supportedMessages = [DidCommOutOfBandInvitation]

  public async handle(
    messageContext: DidCommMessageHandlerInboundMessage<DidCommOutOfBandInvitationHandler>
  ): Promise<undefined> {
    const agentContext = messageContext.agentContext
    messageContext.assertReadyConnection()

    const eventEmitter = agentContext.dependencyManager.resolve(EventEmitter)
    let outOfBandRecord: DidCommOutOfBandRecord
    try {
      ;({ outOfBandRecord } = await getOutOfBandRecord(agentContext, { invitation: messageContext.message }))
    } catch (error) {
      if (!(error instanceof UnsupportedDidcommVersionError)) throw error
      eventEmitter.emit<OutOfBandInvitationEvent>(agentContext, {
        type: OutOfBandInvitationEventTypes.OutOfBandInvitationEvent,
        payload: {
          action: 'Unsupported',
          invitation: messageContext.message,
          did: error.did,
          didcommVersions: error.didcommVersions,
          connection: messageContext.connection,
          messageId: messageContext.message.id,
        },
      })
      return
    }
    // Emit event: OOB Invitation received
    eventEmitter.emit<OutOfBandInvitationEvent>(agentContext, {
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
