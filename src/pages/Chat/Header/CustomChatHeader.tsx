import { StackActions } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { View, TouchableOpacity } from 'react-native'

import getStyles from './styles'

import { ChatStackParams } from '@2060/components/Navigation/NavigationProps'
import { Avatar, Text, SvgIcon, ConnectionMainActions } from '@2060/components/common'
import { useConnectionById } from '@2060/hooks/agent'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { ChatThreadData } from '@2060/model'

interface Props {
  navigation: StackNavigationProp<ChatStackParams, 'Chat', 'stack_navigator_main'>
  chatThread: ChatThreadData
  isTyping: boolean
  showMenuIcon: boolean
  isConnectionDeleted: boolean
  onGoToConnectionDetails(): void
  onShowContextMenu(): void
  onSomeActionDispatched?(): void
  redirectToHomeOnBack: boolean | undefined
}

const CustomChatHeader: React.FC<Props> = ({
  chatThread,
  isTyping,
  onShowContextMenu,
  showMenuIcon,
  isConnectionDeleted,
  navigation,
  onSomeActionDispatched,
  onGoToConnectionDetails,
  redirectToHomeOnBack,
}) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const connection = useConnectionById(chatThread.connectionId)

  const goBack = () => {
    if (redirectToHomeOnBack) {
      navigation.dispatch(StackActions.replace('Home'))
    } else {
      navigation.goBack()
    }
    onSomeActionDispatched?.()
  }

  const goToConnectionDetails = () => {
    onSomeActionDispatched?.()
    onGoToConnectionDetails()
  }

  const handleShowContextMenu = () => {
    onSomeActionDispatched?.()
    onShowContextMenu()
  }

  return (
    <View style={styles.container}>
      <View style={styles.containerHeader}>
        <TouchableOpacity activeOpacity={0.4} onPress={goBack} style={styles.rowContainer}>
          <SvgIcon name="arrowBack" width={28} height={28} fill={theme.colors.primaryText} />
          <View style={styles.containerAvatar}>
            <Avatar
              uri={chatThread.picture}
              label={chatThread.topic}
              size="9.50%"
              bgAvatarInitials={theme.colors.secondary}
            />
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={isConnectionDeleted}
          activeOpacity={0.4}
          style={styles.displayName}
          onPress={goToConnectionDetails}
        >
          <Text fontFamily="EuclidCircularA-Medium" style={styles.name} numberOfLines={1}>
            {chatThread.topic}
          </Text>
          {isTyping && (
            <Text fontFamily="EuclidCircularA-Medium" style={styles.typing}>
              {t('chat.typing')}
            </Text>
          )}
        </TouchableOpacity>
        {connection && (
          <ConnectionMainActions
            connectionId={connection.id}
            navigation={navigation}
            includeDefaultActions={false}
          />
        )}
        {showMenuIcon && (
          <TouchableOpacity onPress={handleShowContextMenu} style={styles.containerIconMenu}>
            <SvgIcon name="menuOutline" fill={theme.colors.primaryText} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

export default CustomChatHeader
