import { ReactElement } from 'react'

import { CustomHeaderProps } from '../ChatMessage/Props'

import { ChatEntryData, LinkMetadata } from '@2060/model'

export interface HtmlChatViewProps extends ChatEntryData {
  metadata: LinkMetadata
  renderCustomHeader(props: CustomHeaderProps): ReactElement
}
