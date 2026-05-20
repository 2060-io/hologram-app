import { EventEmitter } from '@credo-ts/core'
import {
  DidCommInvitationType,
  DidCommMessageHandler,
  DidCommMessageHandlerInboundMessage,
  DidCommOutOfBandInvitation,
  DidCommOutOfBandInvitationV2,
} from '@credo-ts/didcomm'

import { OutOfBandInvitationEvent, OutOfBandInvitationEventTypes } from './OutOfBandEvents'

import { getOutOfBandRecord } from './index'

import { log } from '@src/utils'

/**
 * Inbound handler for v2 OOB invitations arriving through an existing DIDComm v2 connection.
 * Mirrors the v1 handler but converts the v2 invitation to a unified v1
 * DidCommOutOfBandInvitation (which is what the rest of the chat-entry and
 * accept-invitation flows expect). Conversion logic matches credo's internal
 * convertV2InvitationToOutOfBandInvitation, replicated here because credo doesn't re-export it.
 */
export class DidCommOutOfBandInvitationV2Handler implements DidCommMessageHandler {
  public supportedMessages = [DidCommOutOfBandInvitationV2]

  public async handle(
    messageContext: DidCommMessageHandlerInboundMessage<DidCommOutOfBandInvitationV2Handler>,
  ): Promise<undefined> {
    const agentContext = messageContext.agentContext
    messageContext.assertReadyConnection()

    const v2Invitation = messageContext.message
    log(
      `V2 OOB handler: received id=${v2Invitation.id} from=${v2Invitation.from} ` +
        `(via connection=${messageContext.connection?.id ?? 'unknown'})`,
    )
    const invitation = new DidCommOutOfBandInvitation({
      id: v2Invitation.id,
      goal: v2Invitation.body?.goal,
      goalCode: v2Invitation.body?.goalCode,
      services: [v2Invitation.from],
    })
    invitation.invitationType = DidCommInvitationType.V2OutOfBand
    invitation.v2Invitation = v2Invitation

    const { outOfBandRecord } = await getOutOfBandRecord(agentContext, { invitation })
    log(`V2 OOB handler: outOfBandRecord ${outOfBandRecord.id} created/fetched, emitting Received event`)

    agentContext.dependencyManager.resolve(EventEmitter).emit<OutOfBandInvitationEvent>(agentContext, {
      type: OutOfBandInvitationEventTypes.OutOfBandInvitationEvent,
      payload: {
        action: 'Received',
        outOfBandRecord,
        connection: messageContext.connection,
        messageId: messageContext.message.id,
      },
    })
  }
}
