import { MessageReactionOptions } from '@2060.io/credo-ts-didcomm-reactions/build/messages/MessageReactionsMessage'

export type SendTextMessageParameters = {
  didcommConnectionId: string
  message: string
  didcommThreadId?: string
}

export type SendReactionParameters = {
  connectionId: string
  reactions: MessageReactionOptions[]
}
