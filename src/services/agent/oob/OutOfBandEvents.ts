import { BaseEvent } from '@credo-ts/core'
import { DidCommOutOfBandRecord, DidCommConnectionRecord } from '@credo-ts/didcomm'

export enum OutOfBandInvitationEventTypes {
  OutOfBandInvitationEvent = 'OutOfBandInvitationEvent',
}

export interface OutOfBandInvitationEvent extends BaseEvent {
  type: OutOfBandInvitationEventTypes.OutOfBandInvitationEvent
  payload: {
    action: 'Received' | 'Accepted' | 'Refused'
    outOfBandRecord: DidCommOutOfBandRecord
    connection?: DidCommConnectionRecord | null
    messageId?: string
  }
}
