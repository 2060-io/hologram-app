import { BaseEvent, OutOfBandRecord, ConnectionRecord } from '@credo-ts/core'

export enum OutOfBandInvitationEventTypes {
  OutOfBandInvitationEvent = 'OutOfBandInvitationEvent',
}

export interface OutOfBandInvitationEvent extends BaseEvent {
  type: OutOfBandInvitationEventTypes.OutOfBandInvitationEvent
  payload: {
    action: 'Received' | 'Accepted' | 'Refused'
    outOfBandRecord: OutOfBandRecord
    connection?: ConnectionRecord | null
    messageId?: string
  }
}
