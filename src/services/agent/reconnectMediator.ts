import { MobileWsOutboundTransport } from '../transport/MobileWsOutboundTransport'
import { MobileAgent } from './MobileAgent'

const RECONNECT_DEBOUNCE_MS = 1_000

let reconnectTimer: ReturnType<typeof setTimeout> | undefined
const reconnectReasons = new Set<string>()
let reconnectOpenedBefore = 0

// Stopgap until Credo can check live mode on demand: closing the socket makes the pickup loop reconnect
export function reconnectMediator(agent: MobileAgent, reason: string, openedBefore = Date.now()): void {
  reconnectReasons.add(reason)
  reconnectOpenedBefore = Math.max(reconnectOpenedBefore, openedBefore)
  clearTimeout(reconnectTimer)
  reconnectTimer = setTimeout(() => {
    const reasons = [...reconnectReasons].join(', ')
    const socketOpenedBefore = reconnectOpenedBefore
    reconnectReasons.clear()
    reconnectOpenedBefore = 0
    closeMediatorSocket(agent, reasons, socketOpenedBefore).catch((error) => {
      agent.config.logger.warn(`Unable to reconnect to the mediator (${reasons})`, { error })
    })
  }, RECONNECT_DEBOUNCE_MS)
}

export async function closeMediatorSocket(agent: MobileAgent, reasons: string, openedBefore: number): Promise<void> {
  if (!agent.isInitialized) return
  const mediatorConnection = await agent.didcomm.mediationRecipient.findDefaultMediatorConnection()
  const wsTransport = agent.didcomm.outboundTransports.find(
    (transport): transport is MobileWsOutboundTransport => transport instanceof MobileWsOutboundTransport
  )
  const openedAt = mediatorConnection ? wsTransport?.socketOpenedAt(mediatorConnection.id) : undefined
  if (!mediatorConnection || !wsTransport || openedAt === undefined) {
    agent.config.logger.info(`No open mediator socket to reconnect (${reasons})`)
    return
  }
  if (openedAt >= openedBefore) {
    agent.config.logger.info(`Mediator socket opened after the trigger, keeping it (${reasons})`)
    return
  }
  agent.config.logger.warn(`Reconnecting to the mediator (${reasons})`)
  wsTransport.closeSocketByConnectionId(mediatorConnection.id)
}
