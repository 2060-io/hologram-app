import { useCallback, useMemo, useState } from 'react'

import { ConnectionItem, ConnectionsBySections } from './ConnectionList'
import { useConnectionListForDisplay } from './useConnectionListForDisplay'

type Props = {
  search: string
  connections: ConnectionItem[]
}

const getSubConnectionsFiltered = ({ search, connections }: Props) => {
  const connectionsThatMatchWithSearch =
    search.length >= 2
      ? connections.filter((connection) => connection.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()))
      : connections
  const connectionsBySections: ConnectionsBySections[] = []
  connectionsThatMatchWithSearch.forEach((connection) => {
    const firstLetter = connection.name.charAt(0).toLocaleLowerCase()
    const sectionAlreadyExists = connectionsBySections.findIndex((item) => item.title === firstLetter)
    if (sectionAlreadyExists >= 0) {
      connectionsBySections[sectionAlreadyExists].connections.push(connection)
    } else {
      const newSection = { connections: [connection], title: firstLetter }
      connectionsBySections.push(newSection)
    }
  })
  return connectionsBySections
}

export const useConnectionsBySections = ({ excludedConnections }: { excludedConnections: string[] }) => {
  const [search, setSearch] = useState('')
  const [showSearchInput, setShowSearchInput] = useState(false)
  const [currentConnectionToFilter, setCurrentConnectionToFilter] = useState<ConnectionItem>()
  const { connectionsBySections, isSearchingMode } = useConnectionListForDisplay({
    search,
    excludedConnections,
  })

  const subConnectionsBySections = useMemo(() => {
    if (!currentConnectionToFilter) return []
    const newSubConnectionsBySections = getSubConnectionsFiltered({
      search,
      connections: currentConnectionToFilter?.subConnections,
    })
    return newSubConnectionsBySections
  }, [search, currentConnectionToFilter])

  const displaySubConnectionsOfConnection = useCallback((connectionItem: ConnectionItem) => {
    setCurrentConnectionToFilter(connectionItem)
  }, [])

  return {
    search,
    setSearch,
    showSearchInput,
    setShowSearchInput,
    connectionsBySections,
    isSearchingMode,
    currentConnectionToFilter,
    setCurrentConnectionToFilter,
    subConnectionsBySections,
    displaySubConnectionsOfConnection,
  }
}
