import { BaseEvent } from '@credo-ts/core'
import {
  DidCommConnectionRecord,
  DidCommOutOfBandInvitation,
  DidCommOutOfBandRecord,
  DidCommVersion,
} from '@credo-ts/didcomm'

export enum OutOfBandInvitationEventTypes {
  OutOfBandInvitationEvent = 'OutOfBandInvitationEvent',
}

export interface OutOfBandInvitationEvent extends BaseEvent {
  type: OutOfBandInvitationEventTypes.OutOfBandInvitationEvent
  payload:
    | {
        action: 'Received' | 'Accepted' | 'Refused'
        outOfBandRecord: DidCommOutOfBandRecord
        connection?: DidCommConnectionRecord | null
        messageId?: string
      }
    | {
        // The invitation got no out-of-band record: this agent does not support the DIDComm versions of its DID
        action: 'Unsupported'
        invitation: DidCommOutOfBandInvitation
        did: string
        // The versions that the DID document advertises
        didcommVersions: DidCommVersion[]
        connection?: DidCommConnectionRecord | null
        messageId?: string
      }
}
