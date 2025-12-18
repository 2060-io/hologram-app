import { DidCommCallType } from '@2060.io/credo-ts-didcomm-calls'
import { MessageReactionOptions } from '@2060.io/credo-ts-didcomm-reactions/build/messages/MessageReactionsMessage'
import { MessageReceiptOptions } from '@2060.io/credo-ts-didcomm-receipts'

import { CallInfo } from '@2060/hooks/providers/useVideoCallContext'

export type AnoncredsAttribute = {
  name: string
  credentialDefinitionId: string
}

type ConnectionIdParameter = {
  connectionId: string
}

type SendTextMessageParameters = ConnectionIdParameter & {
  message: string
  parentThreadId?: string
}

type SendReactionParameters = ConnectionIdParameter & {
  reactions: MessageReactionOptions[]
}

type SendReceiptsParameters = ConnectionIdParameter & {
  receipts: MessageReceiptOptions[]
}

type ShareMediaParameters = {
  recordId: string
}

type MenuSelectionParameters = ConnectionIdParameter & {
  selectedItemName: string
}

type ForwardConnectionParameters = ConnectionIdParameter & {
  forwarderConnectionId: string
}

type PresentCredentialParameters = ConnectionIdParameter & {
  anoncredsAttributes: AnoncredsAttribute[]
}

type SendAnswerParameters = {
  questionRecordId: string
  response: string
}

type AcceptConnectionRequestParameters = ConnectionIdParameter

type AcceptConnectionResponseParameters = ConnectionIdParameter

type QueryServiceFeaturesParameters = ConnectionIdParameter

type CreateCallOfferParameters = ConnectionIdParameter & {
  callType: DidCommCallType
  callInfo: CallInfo
}

type HangupCallParameters = ConnectionIdParameter & {
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

type BaseProofParameters = {
  proofRecordId: string
}
type DeclineProofRequestParameters = BaseProofParameters

type SendUserProfileParameters = ConnectionIdParameter

type RequestUserProfileParameters = ConnectionIdParameter

type AcceptProofRequestParameters = BaseProofParameters
type AcceptProofProposalParameters = BaseProofParameters

export enum ProofSendProblemReportDescription {
  Refused = 'refused',
  NoCompatibleCredentials = 'e.req.no-compatible-credentials',
  TimeoutWaitingForResponse = 'timeout-waiting-for-response',
}

type ProofSendProblemReportParameters = BaseProofParameters & {
  description: ProofSendProblemReportDescription
}

type SavePushNotificationDeviceInfoParameters = {
  connectionId: string
  deviceToken: string
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
  SendUserProfileParameters,
  RequestUserProfileParameters,
  AcceptProofRequestParameters,
  AcceptProofProposalParameters,
  ProofSendProblemReportParameters,
  SavePushNotificationDeviceInfoParameters,
}
