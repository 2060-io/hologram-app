import { DidCommCredentialExchangeRecord, DidCommCredentialState } from '@credo-ts/didcomm'
import { useEffect, useState, useTransition } from 'react'

import { useMobileAgent } from './agent'
import { recordsRemovedByType, recordsUpdatedByType } from './agent/recordUtils'

import { CredentialDetailsForDisplay, getCredentialDetailsFromExchange } from '@2060/services/agent/display'
import { logError } from '@2060/utils'

export const useCredentialExchangeForDisplay = (options: { credentialRecordId: string }) => {
  const credentialExchangeRecordId = options.credentialRecordId
  const { agent } = useMobileAgent()
  const [credentialDetails, setCredentialDetails] = useState<CredentialDetailsForDisplay>()
  const [credentialState, setCredentialState] = useState<DidCommCredentialState>()
  const [isGettingCredentialDetails, startGetCredentialDetailsTransition] = useTransition()

  const getCredentialDetails = async () => {
    if (!agent) return
    startGetCredentialDetailsTransition(async () => {
      try {
        const { details, state } = await getCredentialDetailsFromExchange(agent, credentialExchangeRecordId)
        setCredentialDetails(details)
        setCredentialState(state)
      } catch (error) {
        logError(`Error getting credential details: ${error}`)
      }
    })
  }

  useEffect(() => {
    getCredentialDetails()
  }, [agent, credentialExchangeRecordId])

  // TODO: optimize to use credentialExchangeRecord directly instead of querying every time
  useEffect(() => {
    if (!isGettingCredentialDetails) {
      const credentialUpdated$ = recordsUpdatedByType(agent, DidCommCredentialExchangeRecord).subscribe(() =>
        getCredentialDetails(),
      )

      const credentialRemoved$ = recordsRemovedByType(agent, DidCommCredentialExchangeRecord).subscribe(() =>
        getCredentialDetails(),
      )

      return () => {
        credentialUpdated$.unsubscribe()
        credentialRemoved$.unsubscribe()
      }
    }
  }, [isGettingCredentialDetails, credentialDetails, agent])

  return { credentialDetails, credentialState }
}
