import { ConnectionRecord, DidExchangeState } from '@credo-ts/core'
import React, { createContext, useState, useEffect, useContext, useMemo } from 'react'

import { useMobileAgent } from './MobileAgentProvider'
import { useAgentConnectionEvents } from './connections/useAgentConnectionEvents'
import {
  addRecord,
  recordsAddedByType,
  recordsRemovedByType,
  RecordsState,
  recordsUpdatedByType,
  removeRecord,
  updateRecord,
} from './recordUtils'

import { ConnectionType } from '@2060/model'
import { getConnectionType } from '@2060/utils/connectionUtils'

export interface ConnectionContextInterface {
  loading: boolean
  connections: ConnectionRecord[]
}

const ConnectionContext = createContext<ConnectionContextInterface | undefined>(undefined)

export const useConnections = () => {
  const connectionContext = useContext(ConnectionContext)
  if (!connectionContext) throw new Error('useConnections must be used within a ConnectionContextProvider')

  return connectionContext
}

export const useConnectionById = (id?: string): ConnectionRecord | undefined => {
  const { connections } = useConnections()

  if (!id) return undefined
  return connections.find((c: ConnectionRecord) => c.id === id)
}

export const useConnectionByState = (state: DidExchangeState): ConnectionRecord[] => {
  const { connections } = useConnections()
  const filteredConnections = useMemo(
    () => connections.filter((c: ConnectionRecord) => c.state === state),
    [connections, state],
  )
  return filteredConnections
}

export const useParentConnections = (): ConnectionRecord[] => {
  const { connections } = useConnections()
  const filteredConnections = useMemo(
    () =>
      connections.filter(
        (c: ConnectionRecord) =>
          c.getTag('parentConnectionId') === undefined &&
          [ConnectionType.Peer, ConnectionType.Service].includes(getConnectionType(c) as ConnectionType),
      ),
    [connections],
  )
  return filteredConnections
}

export const useConnectionByParentConnectionId = (parentConnectionId: string): ConnectionRecord[] => {
  const { connections } = useConnections()
  const filteredConnections = useMemo(
    () => connections.filter((c: ConnectionRecord) => c.getTag('parentConnectionId') === parentConnectionId),
    [connections, parentConnectionId],
  )
  return filteredConnections
}

interface Props {
  children?: React.ReactNode
}

export const ConnectionProvider: React.FC<React.PropsWithChildren<Props>> = ({ children }) => {
  const [state, setState] = useState<RecordsState<ConnectionRecord>>({
    records: [],
    loading: true,
  })

  const { isInitialized, agent } = useMobileAgent()

  const setInitialState = async () => {
    if (agent && isInitialized) {
      const records = await agent.connections.getAll()
      setState({ records, loading: false })
    }
  }

  useEffect(() => {
    setInitialState()
  }, [agent, isInitialized])

  useEffect(() => {
    if (!state.loading) {
      const connectionAdded$ = recordsAddedByType(agent, ConnectionRecord).subscribe(record =>
        setState(addRecord(record, state)),
      )

      const connectionUpdated$ = recordsUpdatedByType(agent, ConnectionRecord).subscribe(record =>
        setState(updateRecord(record, state)),
      )

      const connectionRemoved$ = recordsRemovedByType(agent, ConnectionRecord).subscribe(record =>
        setState(removeRecord(record, state)),
      )

      return () => {
        connectionAdded$.unsubscribe()
        connectionUpdated$.unsubscribe()
        connectionRemoved$.unsubscribe()
      }
    }
  }, [state, agent])

  useAgentConnectionEvents()

  return (
    <ConnectionContext.Provider value={{ connections: state.records, loading: state.loading }}>
      {children}
    </ConnectionContext.Provider>
  )
}

export default ConnectionProvider
