import type WebSocket from 'ws'

import {
  Agent,
  AgentConfig,
  AgentEventTypes,
  AgentMessageReceivedEvent,
  CredoError,
  ConnectionRecord,
  EventEmitter,
  Logger,
  OutboundPackage,
  OutboundTransport,
  OutboundWebSocketOpenedEvent,
  OutboundWebSocketClosedEvent,
  TransportEventTypes,
  Key,
  KeyType,
} from '@credo-ts/core'
import { isDidCommTransportQueue, TransportPriorityOptions } from '@credo-ts/core/build/agent/MessageSender'
import { ResolvedDidCommService } from '@credo-ts/core/build/modules/didcomm'
import { findMatchingEd25519Key } from '@credo-ts/core/build/modules/didcomm/util/matchingEd25519Key'
import {
  DidCommV1Service,
  DidResolverService,
  IndyAgentService,
  getKeyFromVerificationMethod,
} from '@credo-ts/core/build/modules/dids'
import { didKeyToInstanceOfKey, verkeyToInstanceOfKey } from '@credo-ts/core/build/modules/dids/helpers'
import { OutOfBandRecord } from '@credo-ts/core/build/modules/oob/repository'
import { isValidJweStructure, JsonEncoder } from '@credo-ts/core/build/utils'
import { Buffer } from '@credo-ts/core/build/utils/buffer'

import { MediatorConnectedEvent, MediatorDisconnectedEvent, MediatorEventTypes } from './MediatorEventTypes'

function getProtocolScheme(url: string) {
  const [protocolScheme] = url.split(':')
  return protocolScheme
}

interface MobileOutboundWs {
  ws: WebSocket
  opened: boolean
  shallKeepOpened: boolean
  lastActivity: Date
  connectionIds: Set<string>
}

export class TunedMobileWsOutboundTransport implements OutboundTransport {
  private transportTable: Map<string, MobileOutboundWs> = new Map<string, MobileOutboundWs>()
  private agent!: Agent
  private logger!: Logger
  private eventEmitter!: EventEmitter
  private WebSocketClass!: typeof WebSocket
  public supportedSchemes = ['ws', 'wss']
  private didResolverService!: DidResolverService
  private mediatorEndpoints: string[]

  private defaultMediatorConnection?: ConnectionRecord | null
  public constructor() {
    this.mediatorEndpoints = []
  }

  public isConnectedTo(connectionId: string) {
    const record = [...this.transportTable].find(([, item]) => item.connectionIds.has(connectionId))
    return record ? record[1].opened : false
  }

  public async start(agent: Agent): Promise<void> {
    this.agent = agent
    const agentConfig = agent.dependencyManager.resolve(AgentConfig)
    this.didResolverService = agent.dependencyManager.resolve(DidResolverService)
    this.logger = agentConfig.logger
    this.eventEmitter = agent.dependencyManager.resolve(EventEmitter)
    this.logger.debug('Starting WS outbound transport')
    this.WebSocketClass = agentConfig.agentDependencies.WebSocketClass

    this.defaultMediatorConnection = await this.agent.mediationRecipient.findDefaultMediatorConnection()
    if (this.defaultMediatorConnection) {
      const { services } = await this.retrieveServicesByConnection(this.defaultMediatorConnection)
      this.mediatorEndpoints = services.map(value => value.serviceEndpoint)
    }

    this.startIdleSocketTimer()
  }

  private startIdleSocketTimer(interval?: number) {
    const checkInterval = interval ?? 30_000

    setInterval(() => {
      const currentDate = new Date()
      this.transportTable.forEach(item => {
        if (item.shallKeepOpened) return

        if (currentDate.valueOf() - item.lastActivity.valueOf() > checkInterval) {
          item.ws.removeEventListener('message', this.handleMessageEvent)
          item.ws.close()
          this.logger.debug('Socket closed by inactivity')
        }
      })
    }, checkInterval)
  }

  public async stop() {
    this.logger.debug('Stopping WS outbound transport')
    this.transportTable.forEach(item => {
      item.ws.removeEventListener('message', this.handleMessageEvent)
      item.ws.close()
      this.logger.debug('Socket closed!')
    })
  }

  public async sendMessage(outboundPackage: OutboundPackage) {
    const { payload, endpoint, connectionId } = outboundPackage
    this.logger.debug(`Sending outbound message to endpoint '${endpoint}' over WebSocket transport.`, {
      payload,
    })

    if (!endpoint) {
      throw new CredoError("Missing connection or endpoint. I don't know how and where to send the message.")
    }
    //const isNewSocket = this.hasOpenSocket(endpoint);
    const socket = await this.resolveSocket({ socketId: endpoint, endpoint, connectionId })

    // Check if mediator endpoint is among services related to the outbound message.
    // In that case, do not close socket
    const isMediatorEndpoint = this.mediatorEndpoints.some(value => value === endpoint)

    socket.ws.send(Buffer.from(JSON.stringify(payload)))

    socket.lastActivity = new Date()
    socket.shallKeepOpened = isMediatorEndpoint
  }

  private hasOpenSocket(socketId: string) {
    return this.transportTable.get(socketId) !== undefined
  }

  private async resolveSocket({
    socketId,
    endpoint,
    connectionId,
  }: {
    socketId: string
    endpoint?: string
    connectionId?: string
  }) {
    // If we already have a socket connection use it
    let socket = this.transportTable.get(socketId)
    if (!socket || socket.ws.readyState === this.WebSocketClass.CLOSING) {
      if (!endpoint) {
        throw new CredoError("Missing endpoint. I don't know how and where to send the message.")
      }

      socket = await this.createSocketConnection({
        endpoint,
        socketId,
        connectionId,
      })
    }
    // Socket already opened, but inform the connection socket is ready
    else if (connectionId) {
      socket.connectionIds.add(connectionId)
      this.agent.events.emit<OutboundWebSocketOpenedEvent>(this.agent.context, {
        type: TransportEventTypes.OutboundWebSocketOpenedEvent,
        payload: {
          socketId,
          connectionId: connectionId,
        },
      })

      const mediationRecord = await this.agent.mediationRecipient.findByConnectionId(connectionId)
      if (mediationRecord) {
        this.agent.events.emit<MediatorConnectedEvent>(this.agent.context, {
          type: MediatorEventTypes.MediatorConnected,
          payload: {
            mediatorId: mediationRecord.id,
            connectionId: connectionId,
          },
        })
      }
    }

    if (socket.ws.readyState !== this.WebSocketClass.OPEN) {
      throw new CredoError('Socket is not open.')
    }

    return socket
  }

  // NOTE: Because this method is passed to the event handler this must be a lambda method
  // so 'this' is scoped to the 'WsOutboundTransport' class instance
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handleMessageEvent = (event: any) => {
    this.logger.trace('WebSocket message event received.', { url: event.target.url, data: event.data })
    const payload = JsonEncoder.fromBuffer(event.data)
    if (!isValidJweStructure(payload)) {
      throw new Error(
        `Received a response from the other agent but the structure of the
         incoming message is not a DIDComm message: ${payload}`,
      )
    }

    this.logger.debug('Payload received from mediator')
    this.eventEmitter.emit<AgentMessageReceivedEvent>(this.agent.context, {
      type: AgentEventTypes.AgentMessageReceived,
      payload: {
        message: payload,
      },
    })
  }

  private createSocketConnection({
    socketId,
    endpoint,
    connectionId,
  }: {
    socketId: string
    endpoint: string
    connectionId?: string
  }): Promise<MobileOutboundWs> {
    return new Promise((resolve, reject) => {
      this.logger.debug(`Connecting to WebSocket ${endpoint}`)
      const ws = new this.WebSocketClass(endpoint)
      const connectionIds = new Set<string>()

      if (connectionId) connectionIds.add(connectionId)

      const socket = { ws, connectionIds, opened: false, shallKeepOpened: false, lastActivity: new Date() }
      this.transportTable.set(socketId, socket)
      ws.onopen = () => {
        this.logger.debug(`Successfully connected to WebSocket ${endpoint}`)
        socket.opened = true

        resolve(socket)

        this.agent.events.emit<OutboundWebSocketOpenedEvent>(this.agent.context, {
          type: TransportEventTypes.OutboundWebSocketOpenedEvent,
          payload: {
            socketId,
            connectionId: connectionId,
          },
        })

        if (connectionId) {
          this.agent.mediationRecipient.findByConnectionId(connectionId).then(mediationRecord => {
            if (mediationRecord) {
              this.agent.events.emit<MediatorConnectedEvent>(this.agent.context, {
                type: MediatorEventTypes.MediatorConnected,
                payload: {
                  mediatorId: mediationRecord.id,
                  connectionId: connectionId,
                },
              })
            }
          })
        }
      }

      ws.onmessage = event => this.handleMessageEvent(event)

      ws.onerror = error => {
        this.logger.debug(`Error while connecting to WebSocket ${endpoint}`, {
          error,
        })
        reject(error)
      }

      ws.onclose = async () => {
        this.logger.debug(`WebSocket closing to ${endpoint}`)

        const record = this.transportTable.get(socketId)
        const connections = record?.connectionIds
        if (connections && record?.connectionIds && record?.opened) {
          for (const item of connections) {
            this.eventEmitter.emit<OutboundWebSocketClosedEvent>(this.agent.context, {
              type: TransportEventTypes.OutboundWebSocketClosedEvent,
              payload: {
                socketId,
                connectionId: item,
              },
            })

            this.agent.mediationRecipient.findByConnectionId(item).then(mediationRecord => {
              if (mediationRecord) {
                this.agent.events.emit<MediatorDisconnectedEvent>(this.agent.context, {
                  type: MediatorEventTypes.MediatorDisconnected,
                  payload: {
                    mediatorId: mediationRecord.id,
                    connectionId: item,
                  },
                })
              }
            })
          }
        } else {
          this.eventEmitter.emit<OutboundWebSocketClosedEvent>(this.agent.context, {
            type: TransportEventTypes.OutboundWebSocketClosedEvent,
            payload: {
              socketId,
              connectionId,
            },
          })
          if (connectionId && record?.opened) {
            this.agent.mediationRecipient.findByConnectionId(connectionId).then(mediationRecord => {
              if (mediationRecord) {
                this.agent.events.emit<MediatorDisconnectedEvent>(this.agent.context, {
                  type: MediatorEventTypes.MediatorDisconnected,
                  payload: {
                    mediatorId: mediationRecord.id,
                    connectionId: connectionId,
                  },
                })
              }
            })
          }
        }
        this.transportTable.delete(socketId)
      }
    })
  }

  // FIXME: Code taken from MessageSender class. Find a simpler way to get endpoint information
  private async retrieveServicesFromDid(did: string) {
    //this.logger.debug(`Resolving services for did ${did}.`)
    const didDocument = await this.didResolverService.resolveDidDocument(this.agent.context, did)

    const didCommServices: ResolvedDidCommService[] = []

    // FIXME: we currently retrieve did documents for all didcomm services in the did document,
    // and we don't have caching yet so this will re-trigger ledger resolves for each one.
    // Should we only resolve the first service, then the second service, etc...?
    for (const didCommService of didDocument.didCommServices) {
      if (didCommService instanceof IndyAgentService) {
        // IndyAgentService (DidComm v0) has keys encoded as raw publicKeyBase58 (verkeys)
        didCommServices.push({
          id: didCommService.id,
          recipientKeys: didCommService.recipientKeys.map(verkeyToInstanceOfKey),
          routingKeys: didCommService.routingKeys?.map(verkeyToInstanceOfKey) || [],
          serviceEndpoint: didCommService.serviceEndpoint,
        })
      } else if (didCommService instanceof DidCommV1Service) {
        // Resolve dids to DIDDocs to retrieve routingKeys
        const routingKeys: Key[] = []
        for (const routingKey of didCommService.routingKeys ?? []) {
          const routingDidDocument = await this.didResolverService.resolveDidDocument(
            this.agent.context,
            routingKey,
          )
          routingKeys.push(
            getKeyFromVerificationMethod(
              routingDidDocument.dereferenceKey(routingKey, ['authentication', 'keyAgreement']),
            ),
          )
        }

        // Dereference recipientKeys
        const recipientKeys = didCommService.recipientKeys.map(recipientKeyReference => {
          const key = getKeyFromVerificationMethod(
            didDocument.dereferenceKey(recipientKeyReference, ['authentication', 'keyAgreement']),
          )

          if (key.keyType === KeyType.X25519) {
            const matchingEd25519Key = findMatchingEd25519Key(key, didDocument)
            if (matchingEd25519Key) return matchingEd25519Key
          }
          return key
        })

        // DidCommV1Service has keys encoded as key references
        didCommServices.push({
          id: didCommService.id,
          recipientKeys,
          routingKeys,
          serviceEndpoint: didCommService.serviceEndpoint,
        })
      }
    }

    return didCommServices
  }

  private async retrieveServicesByConnection(
    connection: ConnectionRecord,
    transportPriority?: TransportPriorityOptions,
    outOfBand?: OutOfBandRecord,
  ) {
    //this.logger.debug(`Retrieving services for connection '${connection.id}' (${connection.theirLabel})`, {
    //  transportPriority,
    //  connection,
    //})

    let didCommServices: ResolvedDidCommService[] = []

    if (connection.theirDid) {
      //this.logger.debug(`Resolving services for connection theirDid ${connection.theirDid}.`)
      didCommServices = await this.retrieveServicesFromDid(connection.theirDid)
    } else if (outOfBand) {
      if (connection.isRequester) {
        //this.logger.debug(`Resolving services from out-of-band record ${outOfBand?.id}.`)
        // Resolve dids to DIDDocs to retrieve services
        for (const service of outOfBand.outOfBandInvitation.getServices()) {
          if (typeof service === 'string') didCommServices = await this.retrieveServicesFromDid(service)
          // Out of band inline service contains keys encoded as did:key references
          else {
            didCommServices.push({
              id: service.id,
              recipientKeys: service.recipientKeys.map(didKeyToInstanceOfKey),
              routingKeys: service.routingKeys?.map(didKeyToInstanceOfKey) || [],
              serviceEndpoint: service.serviceEndpoint,
            })
          }
        }
      }
    }

    // Separate queue service out
    let services = didCommServices.filter(s => !isDidCommTransportQueue(s.serviceEndpoint))
    const queueService = didCommServices.find(s => isDidCommTransportQueue(s.serviceEndpoint))

    // If restrictive will remove services not listed in schemes list
    if (transportPriority?.restrictive) {
      services = services.filter(service => {
        const serviceSchema = getProtocolScheme(service.serviceEndpoint)
        return transportPriority.schemes.includes(serviceSchema)
      })
    }

    // If transport priority is set we will sort services by our priority
    if (transportPriority?.schemes) {
      services = services.sort(function (a, b) {
        const aScheme = getProtocolScheme(a.serviceEndpoint)
        const bScheme = getProtocolScheme(b.serviceEndpoint)
        return transportPriority?.schemes.indexOf(aScheme) - transportPriority?.schemes.indexOf(bScheme)
      })
    }

    return { services, queueService }
  }
}
