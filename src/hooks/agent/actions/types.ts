import { MessageReactionOptions } from '@2060.io/credo-ts-didcomm-reactions/build/messages/MessageReactionsMessage'
import { MessageReceiptOptions } from '@2060.io/credo-ts-didcomm-receipts'

export type AnoncredsAttribute = {
  name: string
  credentialDefinitionId: string
}

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

type MenuSelectionParameters = {
  connectionId: string
  selectedItemName: string
}

type ForwardConnectionParameters = {
  forwarderConnectionId: string
  connectionId: string
}

type PresentCredentialParameters = {
  connectionId: string
  anoncredsAttributes: AnoncredsAttribute[]
}

type SendAnswerParameters = {
  questionRecordId: string
  response: string
}

export type {
  SendTextMessageParameters,
  SendReactionParameters,
  SendReceiptsParameters,
  ShareMediaParameters,
  MenuSelectionParameters,
  ForwardConnectionParameters,
  PresentCredentialParameters,
  SendAnswerParameters,
}
