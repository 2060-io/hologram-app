import { DidCommConnectionRecord } from '@credo-ts/didcomm'
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

import { ConnectionType } from '@src/model'
import { getConnectionType } from '@src/utils/connectionUtils'

interface ConnectionContextInterface {
  loading: boolean
  connections: DidCommConnectionRecord[]
}

const ConnectionContext = createContext<ConnectionContextInterface | undefined>(undefined)

export const useConnections = () => {
  const connectionContext = useContext(ConnectionContext)
  if (!connectionContext) throw new Error('useConnections must be used within a ConnectionContextProvider')

  return connectionContext
}

export const useConnectionById = (id?: string): DidCommConnectionRecord | undefined => {
  const { connections } = useConnections()

  if (!id) return undefined
  return connections.find((c: DidCommConnectionRecord) => c.id === id)
}

export const useParentConnections = (): DidCommConnectionRecord[] => {
  const { connections } = useConnections()
  const filteredConnections = useMemo(
    () =>
      connections.filter(
        (c: DidCommConnectionRecord) =>
          c.getTag('parentConnectionId') === undefined &&
          [ConnectionType.Peer, ConnectionType.Service].includes(getConnectionType(c) as ConnectionType),
      ),
    [connections],
  )
  return filteredConnections
}

export const useConnectionByParentConnectionId = (parentConnectionId: string): DidCommConnectionRecord[] => {
  const { connections } = useConnections()
  const filteredConnections = useMemo(
    () =>
      connections.filter(
        (c: DidCommConnectionRecord) => c.getTag('parentConnectionId') === parentConnectionId,
      ),
    [connections, parentConnectionId],
  )
  return filteredConnections
}

interface Props {
  children?: React.ReactNode
}

export const ConnectionsProvider: React.FC<React.PropsWithChildren<Props>> = ({ children }) => {
  const { isInitialized, agent } = useMobileAgent()
  const [state, setState] = useState<RecordsState<DidCommConnectionRecord>>({
    records: [],
    loading: true,
  })

  useEffect(() => {
    if (agent) subscribeToAgentConnectionEvents(agent.context)
  }, [agent])

  useEffect(() => {
    const setInitialState = async () => {
      if (agent && isInitialized) {
        const records = await agent.didcomm.connections.getAll()
        setState({ records, loading: false })
      }
    }
    setInitialState()
  }, [agent, isInitialized])

  useEffect(() => {
    if (!state.loading) {
      const connectionAdded$ = recordsAddedByType(agent, DidCommConnectionRecord).subscribe(record =>
        setState(addRecord(record, state)),
      )

      const connectionUpdated$ = recordsUpdatedByType(agent, DidCommConnectionRecord).subscribe(record =>
        setState(updateRecord(record, state)),
      )

      const connectionRemoved$ = recordsRemovedByType(agent, DidCommConnectionRecord).subscribe(record =>
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
