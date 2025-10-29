import { ConnectionRecord } from '@credo-ts/core'
import { useEffect, useState } from 'react'

import { useConnections, useMobileAgent, useParentConnections } from './agent'
import { getStoredServiceInfo } from './useFetchServiceInfo'

import { ConnectionItem, ConnectionListSection } from '@2060/components/Connections/ConnectionsList'
import { MobileAgent } from '@2060/services/agent'
import {
  getConnectionDisplayName,
  getConnectionDisplayPicture,
  filterConnectionsByParentId,
  isService,
} from '@2060/utils/connectionUtils'

const getConnectionItem = async (
  connection: ConnectionRecord,
  findSubConnections: (connectionId: string) => ConnectionRecord[],
  agent: MobileAgent,
): Promise<ConnectionItem> => {
  const isConnectionService = isService(connection)
  let connectionItem: ConnectionItem = {
    id: connection.id,
    name: getConnectionDisplayName(connection),
    isService: isConnectionService,
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
      status: (await getStoredServiceInfo(did, agent))?.status,
    }
  }
  return connectionItem
}

/**
 *
 * Get the connection list ready for display
 *
 * @param connections Array containing all connection records
 * @param findSubConnections Callback that returns all connection records whose parent
 * is the given connection id
 * @returns connection list for display in the form of an array containing each capital letter and
 * the connections starting with it
 */
const getConnectionSections = async (
  connections: ConnectionRecord[],
  findSubConnections: (connectionId: string) => ConnectionRecord[],
  agent: MobileAgent,
) => {
  const connectionsGroupBySections: ConnectionListSection[] = []
  for (const connection of connections) {
    const connectionName = getConnectionDisplayName(connection) as string
    const newSectionItem = await getConnectionItem(connection, findSubConnections, agent)
    const firstLetter = connectionName.charAt(0).toLocaleLowerCase()
    const sectionAlreadyExists = connectionsGroupBySections.findIndex(item => item.title === firstLetter)
    if (sectionAlreadyExists >= 0) {
      connectionsGroupBySections[sectionAlreadyExists].connections.push(newSectionItem)
    } else {
      const newSection = { connections: [newSectionItem], title: firstLetter }
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

export const useConnectionListForDisplay = (options: { search: string; excludedConnections: string[] }) => {
  const [sections, setSections] = useState<ConnectionListSection[]>([])

  const { search, excludedConnections } = options
  const rootConnections = useParentConnections()
  const { connections } = useConnections()

  // FIXME: This is not very efficient, as it does multiple searches
  const searchByName = (dataList: ConnectionListSection[]) => {
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

  const { agent } = useMobileAgent()

  useEffect(() => {
    const getSections = async () => {
      if (!agent) return
      let newSections = await getConnectionSections(
        rootConnections.filter(item => !excludedConnections.includes(item.id)),
        (connectionId: string) =>
          filterConnectionsByParentId(
            connections.filter(item => !excludedConnections.includes(item.id)),
            connectionId,
          ),
        agent,
      )
      if (search.length >= 2) newSections = searchByName(newSections)
      setSections(newSections)
    }

    getSections()
  }, [search, rootConnections, connections, agent])

  return { connectionListForDisplay: sections, isSearchingMode: search.length >= 2 }
}
