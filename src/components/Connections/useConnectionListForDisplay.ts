import { DidCommConnectionRecord } from '@credo-ts/didcomm'
import { useEffect, useState } from 'react'

import { ConnectionItem, ConnectionsBySections } from '@src/components/Connections/ConnectionList'
import { useConnections, useParentConnections } from '@src/hooks/agent'
import { useMobileAgent } from '@src/hooks/agent/MobileAgentProvider'
import { MobileAgent } from '@src/services/agent'
import { getInCacheServiceInfo } from '@src/services/agent/cache'
import {
  getConnectionDisplayName,
  getConnectionDisplayPicture,
  filterConnectionsByParentId,
  isService,
} from '@src/utils/connectionUtils'

const getConnectionItem = async (
  connection: DidCommConnectionRecord,
  findSubConnections: (connectionId: string) => DidCommConnectionRecord[],
  agent: MobileAgent,
): Promise<ConnectionItem> => {
  const isConnectionService = isService(connection)
  let connectionItem: ConnectionItem = {
    id: connection.id,
    name: getConnectionDisplayName(connection),
    isService: isConnectionService,
    invitationDid: connection.invitationDid,
    avatarUrl: getConnectionDisplayPicture(connection),
    subConnections: await Promise.all(
      findSubConnections(connection.id).map(
        async item => await getConnectionItem(item, findSubConnections, agent),
      ),
    ),
  }
  const did = connection.invitationDid
  if (isConnectionService && did) {
    connectionItem = {
      ...connectionItem,
      status: (await getInCacheServiceInfo(did, agent.context))?.status,
    }
  }
  return connectionItem
}

/**
 *
 * Get the connections list ready for display
 *
 * @param connections Array containing all connection records
 * @param findSubConnections Callback that returns all connection records whose parent
 * is the given connection id
 * @returns connection list for display in the form of an array containing each capital letter and
 * the connections starting with it
 */
const getConnectionsBySections = async (
  connections: DidCommConnectionRecord[],
  findSubConnections: (connectionId: string) => DidCommConnectionRecord[],
  agent: MobileAgent,
) => {
  const connectionsGroupBySections: ConnectionsBySections[] = []
  for (const connection of connections) {
    const connectionName = getConnectionDisplayName(connection) as string
    const connectionItem = await getConnectionItem(connection, findSubConnections, agent)
    const firstLetter = connectionName.charAt(0).toLocaleLowerCase()
    const sectionAlreadyExists = connectionsGroupBySections.findIndex(item => item.title === firstLetter)
    if (sectionAlreadyExists >= 0) {
      connectionsGroupBySections[sectionAlreadyExists].connections.push(connectionItem)
    } else {
      const newSection = { connections: [connectionItem], title: firstLetter }
      connectionsGroupBySections.push(newSection)
    }
  }

  return connectionsGroupBySections
    .map(section => ({
      ...section,
      connections: section.connections.sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.title.localeCompare(b.title))
}

// FIXME: This is not very efficient, as it does multiple searches
const searchByName = (dataList: ConnectionsBySections[], search: string) => {
  const matches = dataList.map(section => ({
    ...section,
    connections: section.connections
      .filter(connection => {
        const names = [
          connection.name.toLocaleLowerCase(),
          ...connection.subConnections.map(subConnection => subConnection.name.toLocaleLowerCase()),
        ]
        return names.some(name => name.includes(search.toLocaleLowerCase()))
      })
      .map(connection => ({
        ...connection,
        subConnectionsThatMatchWithSearch: connection.subConnections.filter(subConnection =>
          subConnection.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
        ).length,
      })),
  }))
  // Only those sections with at least a matching connection
  return matches.filter(section => section.connections.length)
}

export const useConnectionListForDisplay = ({
  search,
  excludedConnections,
}: {
  search: string
  excludedConnections: string[]
}) => {
  const { connections } = useConnections()
  const { agent } = useMobileAgent()
  const rootConnections = useParentConnections()
  const [connectionsBySections, setConnectionsBySections] = useState<ConnectionsBySections[]>([])

  useEffect(() => {
    const getSections = async () => {
      if (!agent) return
      let newConnectionsBySections = await getConnectionsBySections(
        rootConnections.filter(item => !excludedConnections.includes(item.id)),
        (connectionId: string) =>
          filterConnectionsByParentId(
            connections.filter(item => !excludedConnections.includes(item.id)),
            connectionId,
          ),
        agent,
      )
      if (search.length >= 2) newConnectionsBySections = searchByName(newConnectionsBySections, search)
      setConnectionsBySections(newConnectionsBySections)
    }
    getSections()
  }, [search, rootConnections, connections, agent])

  return { connectionsBySections, isSearchingMode: search.length >= 2 }
}
