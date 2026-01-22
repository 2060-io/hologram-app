import { ConnectionRecord } from '@credo-ts/core'
import React, { createContext, useState, useEffect, useContext, useMemo } from 'react'

import { useMobileAgent } from './MobileAgentProvider'
import { subscribeToAgentConnectionEvents } from './connections/subscribeToAgentConnectionEvents'
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

interface ConnectionContextInterface {
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
  const { isInitialized, agent } = useMobileAgent()
  const [state, setState] = useState<RecordsState<ConnectionRecord>>({
    records: [],
    loading: true,
  })

  useEffect(() => {
    if (agent) return subscribeToAgentConnectionEvents(agent.context)
  }, [agent])

  useEffect(() => {
    const setInitialState = async () => {
      if (agent && isInitialized) {
        const records = await agent.connections.getAll()
        setState({ records, loading: false })
      }
    }
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

  return (
    <ConnectionContext value={{ connections: state.records, loading: state.loading }}>
      {children}
    </ConnectionContext>
  )
}
