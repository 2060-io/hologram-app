import { DidCommCallType } from '@2060.io/credo-ts-didcomm-calls'
import { DidCommMessageReactionOptions } from '@2060.io/credo-ts-didcomm-reactions'
import { DidCommMessageReceiptOptions } from '@2060.io/credo-ts-didcomm-receipts'
import { DidCommUserProfileData } from '@2060.io/credo-ts-didcomm-user-profile'

import { CallInfo } from '@src/hooks/providers/useVideoCallContext'

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
  reactions: DidCommMessageReactionOptions[]
}

type SendReceiptsParameters = ConnectionIdParameter & {
  receipts: DidCommMessageReceiptOptions[]
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

type SendUserProfileParameters = ConnectionIdParameter & {
  threadId?: string
  parentThreadId?: string
  profileData?: Partial<DidCommUserProfileData> | Record<string, unknown>
  sendBackYours?: boolean
}

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

type DeleteConnectionParameters = ConnectionIdParameter & {
  outOfBandRecordId?: string
}

type SendTrustPingParameters = ConnectionIdParameter

export type {
  AcceptConnectionRequestParameters,
  AcceptConnectionResponseParameters,
  AcceptCredentialOfferParameters,
  AcceptProofProposalParameters,
  AcceptProofRequestParameters,
  CreateCallOfferParameters,
  DeclineCredentialOfferParameters,
  DeclineProofRequestParameters,
  DeleteConnectionParameters,
  ForwardConnectionParameters,
  HangupCallParameters,
  MenuSelectionParameters,
  PresentCredentialParameters,
  ProofSendProblemReportParameters,
  QueryServiceFeaturesParameters,
  RemoveOutOfBandRecordParameters,
  RequestUserProfileParameters,
  SavePushNotificationDeviceInfoParameters,
  SendAnswerParameters,
  SendReactionParameters,
  SendReceiptsParameters,
  SendTextMessageParameters,
  SendTrustPingParameters,
  SendUserProfileParameters,
  ShareMediaParameters,
}
