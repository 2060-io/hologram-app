import { DidCommCallsModule } from '@2060.io/credo-ts-didcomm-calls'
import { MediaSharingModule } from '@2060.io/credo-ts-didcomm-media-sharing'
import { DidCommMrtdModule } from '@2060.io/credo-ts-didcomm-mrtd'
import { DidCommReactionsModule } from '@2060.io/credo-ts-didcomm-reactions'
import { ReceiptsModule } from '@2060.io/credo-ts-didcomm-receipts'
import { UserProfileModule, UserProfileModuleConfig } from '@2060.io/credo-ts-didcomm-user-profile'
import { ActionMenuModule } from '@credo-ts/action-menu'
import {
  AnonCredsCredentialFormatService,
  AnonCredsModule,
  AnonCredsProofFormatService,
  LegacyIndyCredentialFormatService,
  LegacyIndyProofFormatService,
  V1CredentialProtocol,
  V1ProofProtocol,
} from '@credo-ts/anoncreds'
import { AskarModule } from '@credo-ts/askar'
import {
  Agent,
  AutoAcceptCredential,
  AutoAcceptProof,
  ConnectionsModule,
  CredentialsModule,
  DidsModule,
  JsonLdCredentialFormatService,
  JwkDidRegistrar,
  JwkDidResolver,
  KeyDidRegistrar,
  KeyDidResolver,
  MediationRecipientModule,
  MediatorPickupStrategy,
  PeerDidRegistrar,
  PeerDidResolver,
  ProofsModule,
  V2CredentialProtocol,
  V2ProofProtocol,
  WebDidResolver,
} from '@credo-ts/core'
import { OpenId4VcHolderModule } from '@credo-ts/openid4vc'
import { PushNotificationsFcmModule } from '@credo-ts/push-notifications'
import { QuestionAnswerModule } from '@credo-ts/question-answer'
import { WebVhAnonCredsRegistry, WebvhDidResolver } from '@credo-ts/webvh'
import { anoncreds } from '@hyperledger/anoncreds-react-native'
import { ariesAskar } from '@hyperledger/aries-askar-react-native'
import { DidWebAnonCredsRegistry } from 'credo-ts-didweb-anoncreds'
import { IndyVdrProxyDidResolver, IndyVdrProxyAnonCredsRegistry } from 'credo-ts-indy-vdr-proxy-client'

import { getAppCheckHeaders } from '@2060/utils/firebaseUtils'

const SECONDS_PER_DAY = 60 * 60 * 24

export const getMobileAgentModules = (config: {
  mediatorPickupStrategy?: MediatorPickupStrategy
  indyVDRProxyBaseUrl: string
}) => {
  const proxyBaseUrl = config.indyVDRProxyBaseUrl
  return {
    askar: new AskarModule({ ariesAskar }),
    anoncreds: new AnonCredsModule({
      registries: [
        new DidWebAnonCredsRegistry({
          cacheOptions: { allowCaching: true, cacheDurationInSeconds: SECONDS_PER_DAY },
        }),
        new WebVhAnonCredsRegistry(),
        new IndyVdrProxyAnonCredsRegistry({
          proxyBaseUrl,
          headers: getAppCheckHeaders,
          cacheOptions: {
            allowCaching: true,
            cacheDurationInSeconds: SECONDS_PER_DAY,
          },
        }),
      ],
      anoncreds,
    }),
    actionMenu: new ActionMenuModule(),
    dids: new DidsModule({
      registrars: [new KeyDidRegistrar(), new PeerDidRegistrar(), new JwkDidRegistrar()],
      resolvers: [
        new JwkDidResolver(),
        new WebDidResolver(),
        new KeyDidResolver(),
        new PeerDidResolver(),
        new IndyVdrProxyDidResolver({ proxyBaseUrl, headers: getAppCheckHeaders }),
        new WebvhDidResolver(),
      ],
    }),
    calls: new DidCommCallsModule(),
    reactions: new DidCommReactionsModule(),
    connections: new ConnectionsModule({ autoAcceptConnections: false }),
    credentials: new CredentialsModule({
      autoAcceptCredentials: AutoAcceptCredential.Never,
      credentialProtocols: [
        new V1CredentialProtocol({ indyCredentialFormat: new LegacyIndyCredentialFormatService() }),
        new V2CredentialProtocol({
          credentialFormats: [
            new AnonCredsCredentialFormatService(),
            new LegacyIndyCredentialFormatService(),
            new JsonLdCredentialFormatService(),
          ],
        }),
      ],
    }),
    media: new MediaSharingModule(),
    mediationRecipient: new MediationRecipientModule({
      mediatorPickupStrategy: config.mediatorPickupStrategy,
      maximumMessagePickup: 100,
      baseMediatorReconnectionIntervalMs: 1000,
      maximumMediatorReconnectionIntervalMs: 8000,
    }),
    mrtd: new DidCommMrtdModule(),
    openId4VcHolder: new OpenId4VcHolderModule(),
    proofs: new ProofsModule({
      autoAcceptProofs: AutoAcceptProof.Never,
      proofProtocols: [
        new V1ProofProtocol({ indyProofFormat: new LegacyIndyProofFormatService() }),
        new V2ProofProtocol({
          proofFormats: [new AnonCredsProofFormatService(), new LegacyIndyProofFormatService()],
        }),
      ],
    }),
    profile: new UserProfileModule(new UserProfileModuleConfig({ autoSendProfile: false })),
    pushNotifications: new PushNotificationsFcmModule(),
    questionAnswer: new QuestionAnswerModule(),
    receipts: new ReceiptsModule(),
  } as const
}

export class MobileAgent extends Agent<ReturnType<typeof getMobileAgentModules>> {}

export const isRegistered = async (agent: MobileAgent) => {
  if (!agent.isInitialized) return false
  const defaultMediator = await agent.mediationRecipient.findDefaultMediator()
  return defaultMediator !== null
}
