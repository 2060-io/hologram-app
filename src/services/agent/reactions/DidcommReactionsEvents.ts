import { BaseEvent } from '@credo-ts/core'

import { MessageReaction } from './messages'

export enum ReactionsEventTypes {
  MessageReactionsReceived = 'MessageReactionsReceived',
}

export interface MessageReactionsReceivedEvent extends BaseEvent {
  type: ReactionsEventTypes.MessageReactionsReceived
  payload: {
    connectionId: string
    reactions: MessageReaction[]
  }
}
