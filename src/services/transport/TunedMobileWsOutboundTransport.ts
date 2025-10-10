import {
  Agent,
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
  Buffer,
} from '@credo-ts/core'
import { isValidJweStructure, JsonEncoder } from '@credo-ts/core/build/utils'
import WebSocket from 'ws'

import { MediatorConnectedEvent, MediatorDisconnectedEvent, MediatorEventTypes } from './MediatorEventTypes'

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
    const agentConfig = agent.config
    this.logger = agentConfig.logger
    this.eventEmitter = agent.events
    this.logger.debug('Starting WS outbound transport')
    this.WebSocketClass = agentConfig.agentDependencies.WebSocketClass

    this.defaultMediatorConnection = await this.agent.mediationRecipient.findDefaultMediatorConnection()
    if (this.defaultMediatorConnection?.theirDid) {
      const didDoc = await agent.dids.resolveDidDocument(this.defaultMediatorConnection.theirDid)
      this.mediatorEndpoints = didDoc.didCommServices.map(service => service.serviceEndpoint)
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
}
