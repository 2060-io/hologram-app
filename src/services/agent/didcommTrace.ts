import { JsonEncoder, Logger } from '@credo-ts/core'
import {
  DidCommConnectionDidRotatedEvent,
  DidCommConnectionEventTypes,
  DidCommConnectionRecord,
  DidCommConnectionStateChangedEvent,
  DidCommEventTypes,
  DidCommMessage,
  DidCommMessageProcessedEvent,
  DidCommMessageReceivedEvent,
  DidCommMessageSentEvent,
  OutboundMessageSendStatus,
} from '@credo-ts/didcomm'

import { MobileAgent } from './MobileAgent'

const DIDCOMM_TYPE_PREFIX = 'https://didcomm.org/'
const SHORT_ID_LENGTH = 8
const SHORT_PEER_DID_LENGTH = 24

const shortId = (id?: string) => (id ? id.substring(0, SHORT_ID_LENGTH) : '(none)')

const shortType = (type: string) => type.replace(DIDCOMM_TYPE_PREFIX, '')

// The start of a did:peer holds its hash, which identifies the DID
const shortDid = (did?: string) => {
  if (!did) return '(none)'
  const isLongPeerDid = did.startsWith('did:peer:') && did.length > SHORT_PEER_DID_LENGTH
  return isLongPeerDid ? `${did.substring(0, SHORT_PEER_DID_LENGTH)}…` : did
}

const describeMessage = (message: DidCommMessage) => {
  const thread = message.threadId !== message.id ? ` thid=${shortId(message.threadId)}` : ''
  return `${shortType(message.type)} id=${shortId(message.id)}${thread}`
}

const describeConnection = (connection?: DidCommConnectionRecord) =>
  connection ? `connection=${shortId(connection.id)}` : 'connection=(none)'

// A from_prior without `sub` ends the relationship. With `sub`, the peer rotates to that DID.
const describeFromPrior = (fromPrior: string) => {
  try {
    const { iss, sub } = JsonEncoder.fromBase64Url(fromPrior.split('.')[1]) as { iss?: string; sub?: string }
    return sub
      ? `from_prior=ROTATION(${shortDid(iss)} -> ${shortDid(sub)})`
      : `from_prior=TERMINATION(${shortDid(iss)})`
  } catch {
    return 'from_prior=(not decodable)'
  }
}

const describeRecipients = (encryptedMessage: unknown) => {
  const recipients = (encryptedMessage as { recipients?: { header?: { kid?: string } }[] } | undefined)?.recipients
  if (!Array.isArray(recipients)) return '(unknown)'
  return recipients.map((recipient) => shortDid(recipient.header?.kid)).join(', ')
}

/**
 * Writes one log line for each DIDComm message and for each connection change.
 * A search for `DIDCOMM` and `CONNECTION` in the log gives the sequence of a flow.
 */
export function subscribeToDidCommTraceEvents(agent: MobileAgent, logger: Logger) {
  agent.events.on<DidCommMessageReceivedEvent>(DidCommEventTypes.DidCommMessageReceived, ({ payload }) => {
    logger.debug(`DIDCOMM RAW encrypted message received for ${describeRecipients(payload.message)}`)
  })

  agent.events.on<DidCommMessageProcessedEvent>(DidCommEventTypes.DidCommMessageProcessed, ({ payload }) => {
    const { message, connection } = payload
    const fromPrior = (message as DidCommMessage & { fromPrior?: string }).fromPrior
    const rotation = fromPrior ? ` ${describeFromPrior(fromPrior)}` : ''
    logger.info(
      `DIDCOMM IN  ${describeMessage(message)} ${describeConnection(connection)} from=${shortDid(connection?.theirDid)}${rotation}`
    )
  })

  agent.events.on<DidCommMessageSentEvent>(DidCommEventTypes.DidCommMessageSent, ({ payload }) => {
    const { message, connection } = payload.message
    const line = `DIDCOMM OUT ${describeMessage(message)} ${describeConnection(connection)} to=${shortDid(connection?.theirDid)} status=${payload.status}`
    if (payload.status !== OutboundMessageSendStatus.Undeliverable) {
      logger.info(line)
      return
    }
    const reason = connection && !connection.theirDid ? ' reason=the peer terminated this connection' : ''
    logger.warn(`${line}${reason}`)
  })

  agent.events.on<DidCommConnectionStateChangedEvent>(
    DidCommConnectionEventTypes.DidCommConnectionStateChanged,
    ({ payload }) => {
      const { connectionRecord, previousState } = payload
      logger.info(
        `CONNECTION ${shortId(connectionRecord.id)} state ${previousState ?? '(new)'} -> ${connectionRecord.state}` +
          ` role=${connectionRecord.role} didcomm=${connectionRecord.didcommVersion ?? 'v1'}` +
          ` did=${shortDid(connectionRecord.did)} theirDid=${shortDid(connectionRecord.theirDid)}` +
          ` invitationDid=${shortDid(connectionRecord.invitationDid)} outOfBand=${shortId(connectionRecord.outOfBandId)}`
      )
    }
  )

  agent.events.on<DidCommConnectionDidRotatedEvent>(
    DidCommConnectionEventTypes.DidCommConnectionDidRotated,
    ({ payload }) => {
      const { connectionRecord, ourDid, theirDid } = payload
      const { previousTheirDids } = connectionRecord
      if (!connectionRecord.theirDid && previousTheirDids.length > 0) {
        const previousTheirDid = previousTheirDids[previousTheirDids.length - 1]
        logger.warn(
          `CONNECTION ${shortId(connectionRecord.id)} TERMINATED BY PEER previousTheirDid=${shortDid(previousTheirDid)}`
        )
        return
      }
      if (theirDid) {
        logger.info(
          `CONNECTION ${shortId(connectionRecord.id)} theirDid rotated ${shortDid(theirDid.from)} -> ${shortDid(theirDid.to)}`
        )
      }
      if (ourDid) {
        logger.info(
          `CONNECTION ${shortId(connectionRecord.id)} did rotated ${shortDid(ourDid.from)} -> ${shortDid(ourDid.to)}`
        )
      }
    }
  )
}
