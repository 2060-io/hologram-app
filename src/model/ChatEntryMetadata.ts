import { DidCommCallType } from '@2060.io/credo-ts-didcomm-calls'
import { CredentialState, ProofState } from '@credo-ts/core'

import { InvitationState } from './InvitationState'
import { MediaDownloadState } from './MediaDownloadState'
import { MediaUploadState } from './MediaUploadState'

import { CredentialMainInfo } from '@2060/services/agent/display'

export type TextMessageMetadata = {
  content: string
}

export type SystemMessageKind = 'security' | 'blocked' | 'terminated' | 'pending' | 'deleted'

export type SystemMessageMetadata = {
  text: string
  kind: SystemMessageKind
}

export type QuestionMetadata = {
  text: string
  description?: string
  options: string // TODO: this is stringyfied due to a limitation on Realm. should be refactored
  response?: string
}

export type AnswerMetadata = {
  response: string
}

export type ActionMenuSelectionMetadata = {
  selectedItemName: string
}

export type MediaSharingMetadata = {
  mimeType: string
  description?: string
  byteCount?: number
  filename?: string
  localFilePath?: string
  localPreviewFilePath?: string
  mediaUploadId?: string
  mediaUploadState?: MediaUploadState
  mediaUploadProgress?: number
  mediaDownloadState?: MediaDownloadState
  mediaDownloadProgress?: number
}

export type ImageMetadata = MediaSharingMetadata & {
  preview?: string
  width?: number
  height?: number
}

export type VideoMetadata = MediaSharingMetadata & {
  preview?: string
  width?: number
  height?: number
  duration?: number
}

export type VoiceNoteMetadata = MediaSharingMetadata & {
  preview?: string
  duration?: number
  waveform?: string
}

export type LinkMetadata = MediaSharingMetadata & {
  uri: string
  title?: string
  icon?: string
  openingMode?: string
  screenOrientation?: 'portrait' | 'landscape'
}

// TODO: Should be string[] but Realm does not allow to use array. So the whole object is stringyfied
// type RequestedAttributes = Record<string, string[]>

export type VPRequestMetadata = {
  requestedAttributes: string // FIXME! RequestedAttributes;
  proofState: ProofState
  replied: boolean
}

export type VPResponsePresentedCredential = {
  mainInfo: CredentialMainInfo
  attributes?: Record<string, string>
}

export type VPResponseMetadata = {
  proofState: ProofState
  presentedCredentials: string //deserialize it (JSON.parse) and castes to VPResponsePresentedCredential[]
}

export type VCOfferMetadata = {
  credentialState: CredentialState
  issuedAt: number
  schemaId?: string
  schemaName?: string
  issuerName?: string
  issuerId?: string
  issuerLogoUrl?: string
}

export type InvitationMetadata = {
  state: InvitationState
  label: string
  imageUrl?: string
  did: string
}

export enum CallOfferState {
  RECEIVED = 'received',
  REJECTED = 'rejected',
  FINISHED = 'finished',
  EXPIRED = 'expired',
}

export type CallOfferMetadata = {
  callType: DidCommCallType
  roomId: string
  peerId: string
  wsUrl: string
  state: CallOfferState
  description?: string
  offerExpirationTime?: number
}

export type MrzRequestState = 'received' | 'scanned' | 'refused'
export type MrzRequestMetadata = {
  state: MrzRequestState
  parentThreadId?: string
  mrzData?: string
}

export type EmrtdReadRequestState = MrzRequestState

export type EMrtdReadRequestMetadata = {
  state: EmrtdReadRequestState
  parentThreadId?: string
  mrzInfo?: string // It must be deserialized (JSON.parse) and casted to MrzInfo
}

export type MrzInfo = {
  expirationDate: string
  birthDate: string
  documentNumber: string
}
