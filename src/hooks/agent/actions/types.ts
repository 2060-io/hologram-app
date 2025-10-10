import { MessageReactionOptions } from '@2060.io/credo-ts-didcomm-reactions/build/messages/MessageReactionsMessage'
import { MessageReceiptOptions } from '@2060.io/credo-ts-didcomm-receipts'

type SendTextMessageParameters = {
  didcommConnectionId: string
  message: string
  didcommThreadId?: string
}

type SendReactionParameters = {
  connectionId: string
  reactions: MessageReactionOptions[]
}

type SendReceiptsParameters = {
  connectionId: string
  receipts: MessageReceiptOptions[]
}

type ShareMediaParameters = {
  recordId: string
}

export type {
  SendTextMessageParameters,
  SendReactionParameters,
  SendReceiptsParameters,
  ShareMediaParameters,
}
