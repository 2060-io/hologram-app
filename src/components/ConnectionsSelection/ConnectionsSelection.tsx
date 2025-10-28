import { useHeaderHeight } from '@react-navigation/elements'
import { ParamListBase } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SafeAreaView, TouchableOpacity, View } from 'react-native'

import Connections from '../Connections'
import { ConnectionItem } from '../Connections/ConnectionsList'

import getStyles from './styles'

import { SvgIcon, Text } from '@2060/components/common'
import { useConnections } from '@2060/hooks/agent'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { notAllowedConnectionsIdsToSendMessages } from '@2060/utils/connectionUtils'

interface Props {
  navigation: StackNavigationProp<ParamListBase>
  onPressSend: (connectionsId: string[]) => void
  connectionIdToExclude?: string
  headerTitle?: string
}

type SelectedConnection = {
  id: string
  name: string
}

const ConnectionsSelection = ({ navigation, onPressSend, connectionIdToExclude, headerTitle }: Props) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const headerHeight = useHeaderHeight()
  const [selectedConnections, setSelectedConnections] = useState<SelectedConnection[]>([])
  const selectedConnectionNames = selectedConnections.map(({ name }) => name).join(', ')
  const isSendButtonDisabled = !selectedConnections.length
  const { connections } = useConnections()
  const excludedConnections = notAllowedConnectionsIdsToSendMessages(connections)
  if (connectionIdToExclude) excludedConnections.push(connectionIdToExclude)

  const onPressConnection = useCallback((connectionItem: ConnectionItem) => {
    setSelectedConnections(prevState => {
      const newSelectedConnections = [...prevState]
      const connectionAlreadySelectedSelectedIndex = newSelectedConnections.findIndex(
        connection => connection.id === connectionItem.id,
      )
      const connectionIsAlreadySelected = connectionAlreadySelectedSelectedIndex !== -1
      if (connectionIsAlreadySelected) {
        newSelectedConnections.splice(connectionAlreadySelectedSelectedIndex, 1)
      } else {
        const { id, name } = connectionItem
        newSelectedConnections.push({ id, name })
      }
      return newSelectedConnections
    })
  }, [])

  const send = () => {
    onPressSend(selectedConnections.map(connection => connection.id))
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.connectionsContainer}>
        <Connections
          navigation={navigation}
          onPressConnection={onPressConnection}
          headerProps={{ height: headerHeight, title: headerTitle ?? t('navigation.ForwardTo') }}
          allowSelection
          selectedConnections={selectedConnections.map(connection => connection.id)}
          excludedConnections={excludedConnections}
        />
      </View>
      <View style={styles.bottomContainer}>
        <Text fontFamily="EuclidCircularA-Medium" style={styles.selectedConnectionsText} numberOfLines={1}>
          {selectedConnectionNames}
        </Text>
        <TouchableOpacity
          style={[styles.sendButton, isSendButtonDisabled ? styles.disabledSend : styles.enabledSend]}
          disabled={isSendButtonDisabled}
          onPress={send}
        >
          <SvgIcon name="send" fill={theme.colors.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

export default ConnectionsSelection
