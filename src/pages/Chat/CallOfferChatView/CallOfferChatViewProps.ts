import { CallOfferMetadata, ChatEntryRole } from '@src/model'

export type Props = {
  metadata: CallOfferMetadata
  didcommThreadId: string
  role: ChatEntryRole
}
