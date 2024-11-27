import { ChatParticipant } from '../ChatMessage/Props'

import { CallOfferMetadata } from '@2060/model'

export type Props = {
  metadata: CallOfferMetadata
  sender?: ChatParticipant
  didcommThreadId: string
}
