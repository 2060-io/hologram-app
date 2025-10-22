import { ConnectionRecord, OutOfBandRecord, ProofState } from '@credo-ts/core'

import { ChatEntryData, ServiceInfo } from '@2060/model'
import { CredentialMainInfo } from '@2060/services/agent/display'

type TypeParameters = 'oob' | 'd_m' | 'c_i'
type HomeParams = {
  [K in TypeParameters]: string | undefined
}

export type PersonalChatStackParams = {
  PersonalChat: { chatThreadId: string }
  MessageDetails: { selectedMessage: ChatEntryData }
  ConnectionDetails: { connectionId: string }
  ForwardMessages: undefined
  ShareMessages: undefined
  MRZScanner: { didcommThreadId: string }
  PresentCredentialsFromChat: { connectionId: string }
  Camera: undefined
}

export type NavigationStackParams = {
  Home: HomeParams | undefined
  SignUpMain: undefined
  Settings: undefined
  Connections: undefined
  ConnectionsForNewChat: undefined
  Privacy: undefined
  PersonalChatStack: undefined
  OpenIdCredentialOffer: { url: string }
  OpenIdPresentationRequest: { url: string }
  DidcommCredentialOffer: { credentialRecordId: string }
  DidcommPresentationRequest: { did: string; proofRecordId: string }
  ConnectionInvitation: { outOfBandRecord: OutOfBandRecord; existingConnectionId?: string }
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
    presentedAt: string
  }
  ForwardConnection: {
    connection: ConnectionRecord
  }
  PresentCredential: {
    credentialRecordId: string
    attributesToPresent: string[]
  }
  Presentation: {
    mainInfo: CredentialMainInfo
    attributes: Record<string, unknown>
    proofState: ProofState
  }
  ParentalControl: undefined
}
