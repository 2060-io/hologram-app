import { AnonCredsModule } from '@credo-ts/anoncreds'
import {
  AnonCredsDidCommCredentialFormatService,
  AnonCredsDidCommProofFormatService,
} from '@credo-ts/anoncreds/didcomm'
import { AskarModule } from '@credo-ts/askar'
import {
  Agent,
  DidsModule,
  JwkDidRegistrar,
  JwkDidResolver,
  KeyDidRegistrar,
  KeyDidResolver,
  PeerDidRegistrar,
  PeerDidResolver,
  WebDidResolver,
} from '@credo-ts/core'
import {
  DidCommAutoAcceptCredential,
  DidCommAutoAcceptProof,
  DidCommCredentialV2Protocol,
  DidCommHttpOutboundTransport,
  DidCommJsonLdCredentialFormatService,
  DidCommMediatorPickupStrategy,
  DidCommMimeType,
  DidCommModule,
  DidCommProofV2Protocol,
} from '@credo-ts/didcomm'
import { DidCommActionMenuModule } from '@credo-ts/didcomm-action-menu'
import { DidCommCallsModule } from '@credo-ts/didcomm-calls'
import { DidCommMediaSharingModule } from '@credo-ts/didcomm-media-sharing'
import { DidCommMrtdModule } from '@credo-ts/didcomm-mrtd'
import { DidCommPushNotificationsFcmModule } from '@credo-ts/didcomm-push-notifications'
import { DidCommQuestionAnswerModule } from '@credo-ts/didcomm-question-answer'
import { DidCommReactionsModule } from '@credo-ts/didcomm-reactions'
import { DidCommReceiptsModule } from '@credo-ts/didcomm-receipts'
import { DidCommShortenUrlModule } from '@credo-ts/didcomm-shorten-url'
import { DidCommUserProfileModule, DidCommUserProfileModuleConfig } from '@credo-ts/didcomm-user-profile'
import { WebVhDidResolver } from '@credo-ts/webvh'
import { WebVhAnonCredsRegistry } from '@credo-ts/webvh/anoncreds'
import { anoncreds } from '@hyperledger/anoncreds-react-native'
import { askar } from '@openwallet-foundation/askar-react-native'
import { DidCommVersion } from '@src/utils/developer'
import { walletDirectoryPath } from '@src/utils/RNFS'
import { DidWebAnonCredsRegistry } from 'credo-ts-didweb-anoncreds'
import { MobileWsOutboundTransport } from '../transport/MobileWsOutboundTransport'

const SECONDS_PER_DAY = 60 * 60 * 24

export const getMobileAgentModules = (config: {
  mediatorPickupStrategy?: DidCommMediatorPickupStrategy
  didcommVersions: DidCommVersion[]
}) => {
  const { didcommVersions } = config
  return {
    askar: new AskarModule({
      askar,
      store: {
        id: 'afj',
        key: 'key', // This will be replaced afterwards
        database: { type: 'sqlite', config: { path: `${walletDirectoryPath}/afj.sqlite` } },
      },
    }),
    anoncreds: new AnonCredsModule({
      registries: [
        new DidWebAnonCredsRegistry({
          cacheOptions: { allowCaching: true, cacheDurationInSeconds: SECONDS_PER_DAY },
        }),
        new WebVhAnonCredsRegistry(),
      ],
      anoncreds,
    }),
    dids: new DidsModule({
      registrars: [new KeyDidRegistrar(), new PeerDidRegistrar(), new JwkDidRegistrar()],
      resolvers: [
        new JwkDidResolver(),
        new WebDidResolver(),
        new KeyDidResolver(),
        new PeerDidResolver(),
        new WebVhDidResolver(),
      ],
    }),
    didcomm: new DidCommModule({
      didCommMimeType: DidCommMimeType.V1,
      didcommVersions,
      basicMessages: {
        protocols: didcommVersions,
      },
      transports: {
        outbound: [new DidCommHttpOutboundTransport(), new MobileWsOutboundTransport()],
      },
      connections: { autoAcceptConnections: false },
      credentials: {
        autoAcceptCredentials: DidCommAutoAcceptCredential.Never,
        credentialProtocols: [
          new DidCommCredentialV2Protocol({
            credentialFormats: [
              new AnonCredsDidCommCredentialFormatService(),
              new DidCommJsonLdCredentialFormatService(),
            ],
          }),
        ],
      },
      mediationRecipient: {
        mediatorPickupStrategy: config.mediatorPickupStrategy,
        mediationProtocolVersions: didcommVersions,
        maximumMessagePickup: 100,
        baseMediatorReconnectionIntervalMs: 1000,
        maximumMediatorReconnectionIntervalMs: 8000,
      },
      proofs: {
        autoAcceptProofs: DidCommAutoAcceptProof.Never,
        proofProtocols: [
          new DidCommProofV2Protocol({
            proofFormats: [new AnonCredsDidCommProofFormatService()],
          }),
        ],
      },
    }),
    actionMenu: new DidCommActionMenuModule({ strictStateChecking: false }),
    calls: new DidCommCallsModule(),
    reactions: new DidCommReactionsModule(),
    media: new DidCommMediaSharingModule(),
    mrtd: new DidCommMrtdModule(),
    profile: new DidCommUserProfileModule(new DidCommUserProfileModuleConfig({ autoSendProfile: false })),
    pushNotifications: new DidCommPushNotificationsFcmModule(),
    questionAnswer: new DidCommQuestionAnswerModule(),
    receipts: new DidCommReceiptsModule(),
    shortenUrl: new DidCommShortenUrlModule(),
  } as const
}

export class MobileAgent extends Agent<ReturnType<typeof getMobileAgentModules>> {}

export const isRegistered = async (agent: MobileAgent) => {
  if (!agent.isInitialized) return false
  const defaultMediator = await agent.didcomm.mediationRecipient.findDefaultMediator()
  return defaultMediator !== null
}
