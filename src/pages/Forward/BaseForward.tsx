import { useHeaderHeight } from '@react-navigation/elements'
import { ParamListBase } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SafeAreaView, TouchableOpacity, View } from 'react-native'

import { BaseConnections } from '../Connections'

import getStyles from './styles'

import { ConnectionItem } from '@2060/components/ConnectionsList/ConnectionListProps'
import { SvgIcon, Text } from '@2060/components/common'
import { useConnections } from '@2060/hooks/agent'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { notAllowedConnectionsIdsToSendMessages } from '@2060/utils/connectionUtils'

interface Props {
  navigation: StackNavigationProp<ParamListBase>
  onPressForward: (connectionsId: string[]) => void
  connectionId?: string
}

type SelectedConnection = {
  id: string
  name: string
}

const BaseForward = ({ navigation, onPressForward, connectionId }: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { t } = useTranslation()
  const headerHeight = useHeaderHeight()
  const [selectedConnections, setSelectedConnections] = useState<SelectedConnection[]>([])
  const selectedConnectionNames = selectedConnections.map(({ name }) => name).join(', ')
  const isForwardButtonDisabled = !selectedConnections.length
  const { connections } = useConnections()
  const excludedConnections = notAllowedConnectionsIdsToSendMessages(connections)
  if (connectionId) excludedConnections.push(connectionId)

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

  const forward = () => {
    onPressForward(selectedConnections.map(connection => connection.id))
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.connectionsContainer}>
        <BaseConnections
          navigation={navigation}
          onPressConnection={onPressConnection}
          headerProps={{ height: headerHeight, title: t('navigation.ForwardTo') }}
          allowSelection
          selectedConnections={selectedConnections.map(connection => connection.id)}
          excludedConnections={excludedConnections}
        />
      </View>
      <View style={styles.forwardContainer}>
        <Text typography="EuclidCircularA-Medium" style={styles.connectionsToForwardText} numberOfLines={1}>
          {selectedConnectionNames}
        </Text>
        <TouchableOpacity
          style={[styles.forwardButton, { opacity: isForwardButtonDisabled ? 0.5 : 1 }]}
          disabled={isForwardButtonDisabled}
          onPress={forward}
        >
          <SvgIcon name="send" fill={theme.colors.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

export default BaseForward
