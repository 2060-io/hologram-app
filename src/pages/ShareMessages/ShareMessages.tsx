import { useHeaderHeight } from '@react-navigation/elements'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SafeAreaView, TouchableOpacity, View } from 'react-native'

import { BaseConnections } from '../Connections'

import getStyles from './styles'

import { ConnectionItem } from '@2060/components/ConnectionsList/ConnectionListProps'
import { PersonalChatStackParams } from '@2060/components/Navigation/NavigationProps'
import { SvgIcon, Text } from '@2060/components/common'
import { useChatActions } from '@2060/hooks'
import { useConnections } from '@2060/hooks/agent'
import { useSharedDataFromOtherApps } from '@2060/hooks/providers/SharedDataFromOtherAppsProvider'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { notAllowedConnectionsIdsToSendMessages } from '@2060/utils/connectionUtils'

interface Props extends StackScreenProps<PersonalChatStackParams, 'ShareMessages'> {}

type SelectedConnection = {
  id: string
  name: string
}

const ShareMessages = ({ navigation }: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { t } = useTranslation()
  const headerHeight = useHeaderHeight()
  const { shareMessages } = useChatActions()
  const { cancelShare, sharedData } = useSharedDataFromOtherApps()
  const { connections } = useConnections()
  const excludedConnections = notAllowedConnectionsIdsToSendMessages(connections)

  const [selectedConnections, setSelectedConnections] = useState<SelectedConnection[]>([])
  const selectedConnectionNames = selectedConnections.map(({ name }) => name).join(', ')
  const isShareButtonDisabled = !selectedConnections.length

  useEffect(() => {
    return () => {
      cancelShare()
    }
  }, [])

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

  const onShareMessages = () => {
    if (!sharedData) return
    shareMessages(
      selectedConnections.map(connection => connection.id),
      sharedData,
    )
    navigation.goBack()
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.connectionsContainer}>
        <BaseConnections
          navigation={navigation}
          onPressConnection={onPressConnection}
          headerProps={{
            height: headerHeight,
            title: t('navigation.shareWith'),
            defaultBackButton: (
              <TouchableOpacity style={styles.headerLeft} onPress={() => navigation.goBack()}>
                <Text typography="EuclidCircularA-Medium" style={styles.headerBtnText}>
                  {t('general.cancel')}
                </Text>
              </TouchableOpacity>
            ),
          }}
          allowSelection
          selectedConnections={selectedConnections.map(connection => connection.id)}
          excludedConnections={excludedConnections}
        />
      </View>
      <View style={styles.shareContainer}>
        <Text typography="EuclidCircularA-Medium" style={styles.connectionsToShareText} numberOfLines={1}>
          {selectedConnectionNames}
        </Text>
        <TouchableOpacity
          style={[styles.shareButton, { opacity: isShareButtonDisabled ? 0.5 : 1 }]}
          disabled={isShareButtonDisabled}
          onPress={onShareMessages}
        >
          <SvgIcon name="send" fill={theme.colors.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

export default ShareMessages
