import { DidCommCredentialExchangeRecord, DidCommCredentialState } from '@credo-ts/didcomm'
import { CredentialDetailsForDisplay, getCredentialDetailsFromExchange } from '@src/services/agent/display'
import { logError } from '@src/utils'
import { useEffect, useRef, useState } from 'react'
import { useMobileAgent } from './agent'
import { recordsRemovedByType, recordsUpdatedByType } from './agent/recordUtils'

export const useCredentialExchangeForDisplay = (options: { credentialRecordId: string }) => {
  const credentialExchangeRecordId = options.credentialRecordId
  const { agent } = useMobileAgent()
  const [credentialDetails, setCredentialDetails] = useState<CredentialDetailsForDisplay>()
  const [credentialState, setCredentialState] = useState<DidCommCredentialState>()
  const latestRequest = useRef(0)

  const getCredentialDetails = async () => {
    if (!agent) return
    const request = ++latestRequest.current
    try {
      const { details, state } = await getCredentialDetailsFromExchange(agent, credentialExchangeRecordId)
      // An older request can end after a newer one: keep only the result of the latest request
      if (request !== latestRequest.current) return
      setCredentialDetails(details)
      setCredentialState(state)
    } catch (error) {
      logError(`Error getting credential details: ${error}`)
    }
  }

  useEffect(() => {
    getCredentialDetails()
  }, [agent, credentialExchangeRecordId])

  // Keep the subscription active during a request: the record can change after the request reads it
  // TODO: optimize to use credentialExchangeRecord directly instead of querying every time
  useEffect(() => {
    if (!agent) return
    const credentialUpdated$ = recordsUpdatedByType(agent, DidCommCredentialExchangeRecord).subscribe(() =>
      getCredentialDetails()
    )

    const credentialRemoved$ = recordsRemovedByType(agent, DidCommCredentialExchangeRecord).subscribe(() =>
      getCredentialDetails()
    )

    return () => {
      credentialUpdated$.unsubscribe()
      credentialRemoved$.unsubscribe()
    }
  }, [agent, credentialExchangeRecordId])

  return { credentialDetails, credentialState }
}
