import { useState, useMemo, useCallback } from 'react'

import { ConnectionItem, ConnectionListSection } from '@2060/components/ConnectionsList/ConnectionListProps'
import { useConnectionListForDisplay } from '@2060/hooks'

type Props = {
  search: string
  connections: ConnectionItem[]
}

const getSubConnectionsFiltered = ({ search, connections }: Props) => {
  const connectionsThatMatchWithSearch =
    search.length >= 2
      ? connections.filter(connection =>
          connection.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
        )
      : connections
  const connectionsGroupBySections: ConnectionListSection[] = []
  connectionsThatMatchWithSearch.forEach(connection => {
    const firstLetter = connection.name.charAt(0).toLocaleLowerCase()
    const sectionAlreadyExists = connectionsGroupBySections.findIndex(item => item.title === firstLetter)
    if (sectionAlreadyExists >= 0) {
      connectionsGroupBySections[sectionAlreadyExists].connections.push(connection)
    } else {
      const newSection = { connections: [connection], title: firstLetter }
      connectionsGroupBySections.push(newSection)
    }
  })
  return connectionsGroupBySections
}

export const useConnections = (options: { excludedConnections: string[] }) => {
  const { excludedConnections } = options

  const [search, setSearch] = useState('')
  const [showSearchInput, setShowSearchInput] = useState(false)

  const { connectionListForDisplay, isSearchingMode } = useConnectionListForDisplay({
    search,
    excludedConnections,
  })
  const [currentConnectionToFilter, setCurrentConnectionToFilter] = useState<ConnectionItem>()

  const subConnections = useMemo(() => {
    if (!currentConnectionToFilter) return []
    const connectionsGroupBySections = getSubConnectionsFiltered({
      search,
      connections: currentConnectionToFilter?.subConnections,
    })
    return connectionsGroupBySections
  }, [search, currentConnectionToFilter])

  const displaySubConnectionsOfConnection = useCallback((connectionItem: ConnectionItem) => {
    setCurrentConnectionToFilter(connectionItem)
  }, [])

  return {
    search,
    setSearch,
    showSearchInput,
    setShowSearchInput,
    connectionListForDisplay,
    isSearchingMode,
    currentConnectionToFilter,
    setCurrentConnectionToFilter,
    subConnections,
    displaySubConnectionsOfConnection,
  }
}
