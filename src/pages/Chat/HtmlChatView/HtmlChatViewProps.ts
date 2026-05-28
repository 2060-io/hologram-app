import { ChatEntryData, LinkMetadata } from '@src/model'
import { ReactElement } from 'react'
import { CustomHeaderProps } from '../ChatMessage/Props'

export interface HtmlChatViewProps extends ChatEntryData {
  metadata: LinkMetadata
  renderCustomHeader(props: CustomHeaderProps): ReactElement
}
