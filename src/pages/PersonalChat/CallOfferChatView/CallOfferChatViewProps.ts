import { ChatParticipant } from '../ChatMessage'

import { CallOfferMetadata } from '@2060/model'

export type Props = {
  sender?: ChatParticipant
  metadata: CallOfferMetadata
}
