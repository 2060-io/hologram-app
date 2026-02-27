import { DidCommConnectionRecord, DidCommOutOfBandRecord, DidCommProofState } from '@credo-ts/didcomm'

import { ChatEntryData, ServiceInfo } from '@src/model'
import { CredentialMainInfo } from '@src/services/agent/display'

type TypeParameters = 'oob' | 'd_m' | 'c_i'
type HomeParams = {
  [K in TypeParameters]: string | undefined
}

export type ChatStackParams = {
  Chat: { chatThreadId: string; redirectToHomeOnBack?: boolean }
  MessageDetails: { selectedMessage: ChatEntryData }
  ConnectionDetails: { connectionId: string }
  ForwardMessages: undefined
  ShareMessages: undefined
  MRZScanner: { didcommThreadId: string }
}

export type NavigationStackParams = {
  Home: HomeParams | undefined
  SignUpMain: undefined
  Settings: undefined
  Scan: undefined
  Connections: undefined
  ConnectionsForNewChat: undefined
  Privacy: undefined
  ChatStack: undefined
  OpenIdCredentialOffer: { url: string }
  OpenIdPresentationRequest: { url: string }
  DidcommCredentialOffer: { credentialRecordId: string; did?: string }
  DidcommPresentationRequest: { did: string; proofRecordId: string }
  ConnectionInvitation: { outOfBandRecord: DidCommOutOfBandRecord; existingConnectionId?: string }
  ConnectionDetails: { connectionId: string }
  RelatedConnections: { parentConnectionId: string }
  UserInvitation: undefined
  UserProfile: undefined
  ProfileCreation: undefined
  WalletBackup: undefined
  RestoreWalletBackup: undefined
  ChangeBackupPassword: undefined
  Wallet: undefined
  // TODO: Maybe this goes into a separate WalletStack?
  CredentialDetails: { credentialRecordId: string }
  Developer: undefined
  CredentialPresented: {
    verifier: ServiceInfo
    credentials: CredentialMainInfo[]
  }
  ForwardConnection: {
    connection: DidCommConnectionRecord
  }
  PresentCredential: {
    credentialRecordId: string
    attributesToPresent: string[]
  }
  CredentialPresentation: {
    chatEntryId: string
    credentialMainInfo: CredentialMainInfo
    credentialAttributes: Record<string, unknown>
    proofState: DidCommProofState
    proofRecordId: string
  }
  EphemeralCredentialPresentation: {
    proofRecordId: string
  }
  ParentalControl: undefined
  PresentCredentialsFromChat: { connectionId: string }
  SelectCredentialAttributes: {
    presentDirectly: boolean
    credentialRecordId: string
    connectionToPresent?: string
  }
  PresentCredentialAsQR: {
    credentialRecordId: string
    attributesToPresent: string[]
  }
  IdentityCredentialIssuers: undefined
}
