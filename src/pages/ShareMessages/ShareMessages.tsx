import { useHeaderHeight } from '@react-navigation/elements'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableOpacity, View } from 'react-native'

import getStyles from './styles'

import { Connections } from '@src/components'
import { ConnectionItem } from '@src/components/Connections/ConnectionList'
import { ChatStackParams } from '@src/components/Navigation/NavigationProps'
import { SvgIcon, Text } from '@src/components/common'
import { useChatActions } from '@src/hooks'
import { useConnections } from '@src/hooks/agent'
import { useSharedDataFromOtherApps } from '@src/hooks/providers/SharedDataFromOtherAppsProvider'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { notAllowedConnectionsIdsToSendMessages } from '@src/utils/connectionUtils'

type Props = StackScreenProps<ChatStackParams, 'ShareMessages'>

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

  const updateSelectedConnections = useCallback((connectionItem: ConnectionItem) => {
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
    navigation.goBack()
    shareMessages(
      selectedConnections.map(connection => connection.id),
      sharedData,
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.connectionsContainer}>
        <Connections
          navigation={navigation}
          onPressConnection={updateSelectedConnections}
          headerProps={{
            height: headerHeight,
            title: t('navigation.shareWith'),
            defaultBackButton: (
              <TouchableOpacity style={styles.headerLeft} onPress={() => navigation.goBack()}>
                <Text fontFamily="EuclidCircularA-Medium" style={styles.headerBtnText}>
                  {t('general.cancel')}
                </Text>
              </TouchableOpacity>
            ),
          }}
          selectedConnections={selectedConnections.map(connection => connection.id)}
          excludedConnections={excludedConnections}
        />
      </View>
      <View style={styles.shareContainer}>
        <Text fontFamily="EuclidCircularA-Medium" style={styles.connectionsToShareText} numberOfLines={1}>
          {selectedConnectionNames}
        </Text>
        <TouchableOpacity
          style={[styles.shareButton, isShareButtonDisabled ? styles.disabledForward : styles.enabledForward]}
          disabled={isShareButtonDisabled}
          onPress={onShareMessages}
        >
          <SvgIcon name="send" fill={theme.colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default ShareMessages
