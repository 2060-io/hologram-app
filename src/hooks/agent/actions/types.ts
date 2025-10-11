import { DidCommCallType } from '@2060.io/credo-ts-didcomm-calls'
import { MessageReactionOptions } from '@2060.io/credo-ts-didcomm-reactions/build/messages/MessageReactionsMessage'
import { MessageReceiptOptions } from '@2060.io/credo-ts-didcomm-receipts'

import { CallInfo } from '@2060/hooks/providers/useVideoCallContext'

export type AnoncredsAttribute = {
  name: string
  credentialDefinitionId: string
}

type SendTextMessageParameters = {
  connectionId: string
  message: string
  parentThreadId?: string
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

type AcceptConnectionRequestParameters = {
  connectionId: string
}

type AcceptConnectionResponseParameters = {
  connectionId: string
}

type QueryServiceFeaturesParameters = {
  connectionId: string
}

type CreateCallOfferParameters = {
  connectionId: string
  callType: DidCommCallType
  callInfo: CallInfo
}

type HangupCallParameters = {
  connectionId: string
  threadId?: string | undefined
}

type RemoveOutOfBandRecordParameters = {
  outOfBandId: string
}

type AcceptCredentialOfferParameters = {
  credentialRecordId: string
}

type DeclineCredentialOfferParameters = {
  credentialRecordId: string
}

type DeclineProofRequestParameters = {
  proofRecordId: string
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
  AcceptConnectionRequestParameters,
  AcceptConnectionResponseParameters,
  QueryServiceFeaturesParameters,
  CreateCallOfferParameters,
  HangupCallParameters,
  RemoveOutOfBandRecordParameters,
  AcceptCredentialOfferParameters,
  DeclineCredentialOfferParameters,
  DeclineProofRequestParameters,
}
