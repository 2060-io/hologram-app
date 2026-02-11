import { ReactElement } from 'react'

import { CustomHeaderProps } from '../ChatMessage/Props'

import { ChatEntryData, LinkMetadata } from '@src/model'

export interface HtmlChatViewProps extends ChatEntryData {
  metadata: LinkMetadata
  renderCustomHeader(props: CustomHeaderProps): ReactElement
}
