import { CallOfferMetadata, ChatEntryRole } from '@2060/model'

export type Props = {
  metadata: CallOfferMetadata
  didcommThreadId: string
  role: ChatEntryRole
}
