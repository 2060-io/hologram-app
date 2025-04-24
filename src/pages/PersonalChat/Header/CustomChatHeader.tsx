import { StackNavigationProp } from '@react-navigation/stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { View, TouchableOpacity } from 'react-native'

import getStyles from './styles'

import { PersonalChatStackParams } from '@2060/components/Navigation/NavigationProps'
import { Avatar, Text, SvgIcon, ConnectionMainActions } from '@2060/components/common'
import { useConnectionById } from '@2060/hooks/agent'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { ChatThreadData } from '@2060/model'

interface Props {
  navigation: StackNavigationProp<PersonalChatStackParams, 'PersonalChat', 'stack_navigator_main'>
  chatThread: ChatThreadData
  isTyping: boolean
  showMenuIcon: boolean
  onGoToConnectionDetails(): void
  onShowContextMenu(): void
  onSomeActionDispatched?(): void
}

const CustomChatHeader: React.FC<Props> = props => {
  const { chatThread, isTyping, onShowContextMenu, showMenuIcon } = props
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)

  const { primaryText, secondary } = theme.colors

  const connection = useConnectionById(chatThread.connectionId)
  const goBack = () => {
    props.navigation.goBack()
    props?.onSomeActionDispatched?.()
  }

  const goToConnectionDetails = () => {
    props?.onSomeActionDispatched?.()
    props.onGoToConnectionDetails()
  }

  const handleShowContextMenu = () => {
    props?.onSomeActionDispatched?.()
    onShowContextMenu()
  }

  return (
    <View style={styles.container}>
      <View style={styles.containerHeader}>
        <TouchableOpacity activeOpacity={0.4} onPress={goBack} style={styles.rowContainer}>
          <SvgIcon name="arrowBack" width={28} height={28} fill={primaryText} />
          <View style={styles.containerAvatar}>
            <Avatar
              uri={chatThread.picture}
              label={chatThread.topic}
              size="9.50%"
              bgAvatarInitials={secondary}
            />
          </View>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.4} style={styles.displayName} onPress={goToConnectionDetails}>
          <Text typography="EuclidCircularA-Medium" style={styles.name} numberOfLines={1}>
            {props.chatThread.topic}
          </Text>
          {isTyping && (
            <Text typography="EuclidCircularA-Medium" style={styles.typing}>
              {t('personalChat.typing')}
            </Text>
          )}
        </TouchableOpacity>
        {connection && (
          <ConnectionMainActions
            connectionId={connection.id}
            navigation={props.navigation}
            includeDefaultActions={false}
          />
        )}
        {showMenuIcon && (
          <TouchableOpacity onPress={handleShowContextMenu} style={styles.containerIconMenu}>
            <SvgIcon name="menuOutline" fill={primaryText} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

export default CustomChatHeader
