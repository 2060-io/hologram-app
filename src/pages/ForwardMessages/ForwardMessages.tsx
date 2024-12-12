import { DidExchangeState } from '@credo-ts/core'
import { useHeaderHeight } from '@react-navigation/elements'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SafeAreaView, TouchableOpacity, View } from 'react-native'

import { BaseConnections } from '../Connections'

import getStyles from './styles'

import { ConnectionItem } from '@2060/components/ConnectionsList/ConnectionListProps'
import { PersonalChatStackParams } from '@2060/components/Navigation/NavigationProps'
import { SvgIcon, Text } from '@2060/components/common'
import { useChatActions } from '@2060/hooks'
import { useChat, useConnections } from '@2060/hooks/agent'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'

interface Props extends StackScreenProps<PersonalChatStackParams, 'ForwardMessages'> {}

type SelectedConnection = {
  id: string
  name: string
}

const ForwardMessages = ({ navigation }: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { t } = useTranslation()
  const headerHeight = useHeaderHeight()
  const { forwardSelectedMessages } = useChatActions()
  const { stopSelectingMessagesMode, chatThread } = useChat()
  const [selectedConnections, setSelectedConnections] = useState<SelectedConnection[]>([])
  const selectedConnectionNames = selectedConnections.map(({ name }) => name).join(', ')
  const isForwardButtonDisabled = !selectedConnections.length
  const { connections } = useConnections()

  const excludedConnections = connections
    .filter(({ state }) => state !== DidExchangeState.Completed)
    .map(({ id }) => id)
  if (chatThread) excludedConnections.push(chatThread.data.connectionId)

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

  const forwardMessages = () => {
    forwardSelectedMessages(selectedConnections.map(connection => connection.id))
    stopSelectingMessagesMode()
    navigation.goBack()
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
          onPress={forwardMessages}
        >
          <SvgIcon name="send" fill={theme.colors.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

export default ForwardMessages
