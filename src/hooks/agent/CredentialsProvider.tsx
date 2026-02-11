import { W3cCredentialRecord } from '@credo-ts/core'
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react'

import { useMobileAgent } from './MobileAgentProvider'
import {
  addRecord,
  recordsAddedByType,
  recordsRemovedByType,
  RecordsState,
  recordsUpdatedByType,
  removeRecord,
  updateRecord,
} from './recordUtils'

interface CredentialContextInterface {
  records: W3cCredentialRecord[]
  getCredentialById: (id: string) => W3cCredentialRecord | undefined
}

const CredentialContext = createContext<CredentialContextInterface | undefined>(undefined)

export const useCredentials = () => {
  const credentialContext = useContext(CredentialContext)
  if (!credentialContext) throw new Error('useCredentials must be used within a CredentialContextProvider')

  return credentialContext
}

interface Props {
  children?: React.ReactNode
}

export const CredentialsProvider: React.FC<React.PropsWithChildren<Props>> = ({ children }) => {
  const [w3cState, setW3CState] = useState<RecordsState<W3cCredentialRecord>>({
    records: [],
    loading: true,
  })

  const { isInitialized, agent } = useMobileAgent()

  const setInitialState = async () => {
    if (agent && isInitialized) {
      const w3cRecords = await agent.w3cCredentials.getAll()
      setW3CState({ records: w3cRecords, loading: false })
    }
  }

  useEffect(() => {
    setInitialState()
  }, [agent, isInitialized])

  useEffect(() => {
    if (!w3cState.loading) {
      const credentialAdded$ = recordsAddedByType(agent, W3cCredentialRecord).subscribe(record =>
        setW3CState(addRecord(record, w3cState)),
      )

      const credentialUpdated$ = recordsUpdatedByType(agent, W3cCredentialRecord).subscribe(record =>
        setW3CState(updateRecord(record, w3cState)),
      )

      const credentialRemoved$ = recordsRemovedByType(agent, W3cCredentialRecord).subscribe(record =>
        setW3CState(removeRecord(record, w3cState)),
      )

      return () => {
        credentialAdded$.unsubscribe()
        credentialUpdated$.unsubscribe()
        credentialRemoved$.unsubscribe()
      }
    }
  }, [w3cState, agent])

  const getCredentialById = useCallback(
    (id: string) => {
      return w3cState.records.find(credential => credential.id === id)
    },
    [w3cState.records],
  )

  return (
    <CredentialContext value={{ records: w3cState.records, getCredentialById }}>{children}</CredentialContext>
  )
}
