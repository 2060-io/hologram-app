import { DidCommCallsModule } from '@2060.io/credo-ts-didcomm-calls'
import { DidCommMediaSharingModule } from '@2060.io/credo-ts-didcomm-media-sharing'
import { DidCommMrtdModule } from '@2060.io/credo-ts-didcomm-mrtd'
import { DidCommReactionsModule } from '@2060.io/credo-ts-didcomm-reactions'
import { DidCommReceiptsModule } from '@2060.io/credo-ts-didcomm-receipts'
import { DidCommShortenUrlModule } from '@2060.io/credo-ts-didcomm-shorten-url'
import { DidCommUserProfileModule, DidCommUserProfileModuleConfig } from '@2060.io/credo-ts-didcomm-user-profile'
import { ActionMenuModule } from '@credo-ts/action-menu'
import {
  AnonCredsDidCommCredentialFormatService,
  AnonCredsDidCommProofFormatService,
  AnonCredsModule,
  DidCommCredentialV1Protocol,
  DidCommProofV1Protocol,
  LegacyIndyDidCommCredentialFormatService,
  LegacyIndyDidCommProofFormatService,
} from '@credo-ts/anoncreds'
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
import { DidCommPushNotificationsFcmModule } from '@credo-ts/didcomm-push-notifications'
import { QuestionAnswerModule } from '@credo-ts/question-answer'
import { WebVhAnonCredsRegistry, WebVhDidResolver } from '@credo-ts/webvh'
import { anoncreds } from '@hyperledger/anoncreds-react-native'
import { askar } from '@openwallet-foundation/askar-react-native'
import { DidCommVersion } from '@src/utils/developer'
import { getAppCheckHeaders } from '@src/utils/firebaseUtils'
import { walletDirectoryPath } from '@src/utils/RNFS'
import { DidWebAnonCredsRegistry } from 'credo-ts-didweb-anoncreds'
import { IndyVdrProxyAnonCredsRegistry, IndyVdrProxyDidResolver } from 'credo-ts-indy-vdr-proxy-client'
import { MobileWsOutboundTransport } from '../transport/MobileWsOutboundTransport'

const SECONDS_PER_DAY = 60 * 60 * 24

export const getMobileAgentModules = (config: {
  mediatorPickupStrategy?: DidCommMediatorPickupStrategy
  indyVDRProxyBaseUrl: string
  didcommVersions: DidCommVersion[]
}) => {
  const proxyBaseUrl = config.indyVDRProxyBaseUrl
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
    dids: new DidsModule({
      registrars: [new KeyDidRegistrar(), new PeerDidRegistrar(), new JwkDidRegistrar()],
      resolvers: [
        new JwkDidResolver(),
        new WebDidResolver(),
        new KeyDidResolver(),
        new PeerDidResolver(),
        new IndyVdrProxyDidResolver({ proxyBaseUrl, headers: getAppCheckHeaders }),
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
          new DidCommCredentialV1Protocol({
            indyCredentialFormat: new LegacyIndyDidCommCredentialFormatService(),
          }),
          new DidCommCredentialV2Protocol({
            credentialFormats: [
              new AnonCredsDidCommCredentialFormatService(),
              new LegacyIndyDidCommCredentialFormatService(),
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
          new DidCommProofV1Protocol({ indyProofFormat: new LegacyIndyDidCommProofFormatService() }),
          new DidCommProofV2Protocol({
            proofFormats: [new AnonCredsDidCommProofFormatService(), new LegacyIndyDidCommProofFormatService()],
          }),
        ],
      },
    }),
    actionMenu: new ActionMenuModule({ strictStateChecking: false }),
    calls: new DidCommCallsModule(),
    reactions: new DidCommReactionsModule(),
    media: new DidCommMediaSharingModule(),
    mrtd: new DidCommMrtdModule(),
    profile: new DidCommUserProfileModule(new DidCommUserProfileModuleConfig({ autoSendProfile: false })),
    pushNotifications: new DidCommPushNotificationsFcmModule(),
    questionAnswer: new QuestionAnswerModule(),
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
