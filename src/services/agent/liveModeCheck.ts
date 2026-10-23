import {
  DidCommConnectionRecord,
  DidCommEventTypes,
  DidCommMediationRecord,
  DidCommMessageProcessedEvent,
  DidCommMessageSender,
  DidCommOutboundMessageContext,
  DidCommStatusRequestV2Message,
  DidCommStatusRequestV4Message,
  DidCommStatusV2Message,
  DidCommStatusV4Message,
} from '@credo-ts/didcomm'
import { first, firstValueFrom, map, timeout } from 'rxjs'
import { MobileWsOutboundTransport } from '../transport/MobileWsOutboundTransport'
import { MobileAgent } from './MobileAgent'
import { reconnectMediator } from './reconnectMediator'

const LIVE_MODE_CHECK_INTERVAL_MS = 15_000
const LIVE_MODE_REPLY_TIMEOUT_MS = 10_000
// Credo's pickup on a new socket times out after 10 s, so live mode setup is over by then
const MIN_SOCKET_AGE_MS = 12_000

type DidCommStatusMessage = DidCommStatusV2Message | DidCommStatusV4Message

// Credo only reconnects when the socket closes, so a half-open socket or a lost live session would go unnoticed
export function startLiveModeChecks(agent: MobileAgent): () => void {
  let stopped = false
  let checking = false
  let liveDeliveryOffSocket: number | undefined

  async function check(): Promise<void> {
    const mediator = await agent.didcomm.mediationRecipient.findDefaultMediator()
    const openedAt = mediator ? socketOpenedAt(agent, mediator.connectionId) : undefined
    if (!mediator || openedAt === undefined || Date.now() - openedAt < MIN_SOCKET_AGE_MS) return

    const checkedAt = Date.now()
    let reason: string
    try {
      const connection = await agent.didcomm.connections.getById(mediator.connectionId)
      if (stopped) return
      const status = await requestStatus(agent, mediator, connection)
      const offBefore = liveDeliveryOffSocket === openedAt
      liveDeliveryOffSocket = status.liveDelivery === false ? openedAt : undefined
      if (status.liveDelivery !== false) return
      // With waiting messages the reply already triggered a delivery request, so that gets one interval to finish
      if (status.messageCount > 0 && !offBefore) return
      reason = 'live mode check found live delivery off'
    } catch (error) {
      reason = `live mode check failed (${error})`
    }
    if (!stopped) reconnectMediator(agent, reason, checkedAt)
  }

  const timer = setInterval(() => {
    if (checking) return
    checking = true
    check()
      .catch((error) => agent.config.logger.warn('Unable to check live mode', { error }))
      .finally(() => {
        checking = false
      })
  }, LIVE_MODE_CHECK_INTERVAL_MS)

  return () => {
    stopped = true
    clearInterval(timer)
  }
}

async function requestStatus(
  agent: MobileAgent,
  mediator: DidCommMediationRecord,
  connection: DidCommConnectionRecord
): Promise<DidCommStatusMessage> {
  const statusRequest =
    mediator.protocolVersion === 'v2' ? new DidCommStatusRequestV4Message({}) : new DidCommStatusRequestV2Message({})
  const reply = firstValueFrom(
    agent.events.observable<DidCommMessageProcessedEvent>(DidCommEventTypes.DidCommMessageProcessed).pipe(
      map((event) => event.payload.message),
      first(
        (message): message is DidCommStatusMessage =>
          (message instanceof DidCommStatusV2Message || message instanceof DidCommStatusV4Message) &&
          message.threadId === statusRequest.threadId
      ),
      timeout(LIVE_MODE_REPLY_TIMEOUT_MS)
    )
  )
  const [status] = await Promise.all([
    reply,
    agent.dependencyManager
      .resolve(DidCommMessageSender)
      .sendMessage(new DidCommOutboundMessageContext(statusRequest, { agentContext: agent.context, connection }), {
        transportPriority: { schemes: ['wss', 'ws'], restrictive: true },
      }),
  ])
  return status
}

function socketOpenedAt(agent: MobileAgent, connectionId: string): number | undefined {
  return agent.didcomm.outboundTransports
    .find((transport): transport is MobileWsOutboundTransport => transport instanceof MobileWsOutboundTransport)
    ?.socketOpenedAt(connectionId)
}
