import { isService } from '@src/utils/connectionUtils'
import { useEffect, useState } from 'react'
import { useMobileAgent } from './agent'

/**
 * Display metadata only carries the issuer DID on the offer that opened the connection. A second
 * offer over an established connection arrives without it, and resolving an empty DID renders on
 * the card as "the resolver could not be reached" for a service the registry answers for.
 */
export const useTrustDidForCredential = (options: { did?: string; credentialRecordId: string }) => {
  const { agent } = useMobileAgent()
  const [didFromConnection, setDidFromConnection] = useState<string>()

  useEffect(() => {
    if (options.did || !agent) return
    const resolveFromConnection = async () => {
      const record = await agent.didcomm.credentials.getById(options.credentialRecordId)
      if (!record.connectionId) return
      const connection = await agent.didcomm.connections.getById(record.connectionId)
      if (isService(connection)) setDidFromConnection(connection.invitationDid)
    }
    resolveFromConnection().catch(() => setDidFromConnection(undefined))
  }, [agent, options.did, options.credentialRecordId])

  return options.did || didFromConnection
}
