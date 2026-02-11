import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { View, TouchableOpacity } from 'react-native'

import Avatar from '../common/Avatar'

import getStyles from './styles'

import { Text, MessageStateIcon, SvgIcon } from '@src/components/common'
import { useConnectionById } from '@src/hooks/agent'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { ChatEntryState, ChatThreadData } from '@src/model'
import { chatDateFormat } from '@src/utils/dateUtils'

interface Props extends ChatThreadData {
  using24HourFormat: boolean
  onPressChatThread(): void
  childCount?: number
}

const ChatThread = ({
  picture,
  lastActivityAt,
  lastChildActivityAt,
  preview,
  topic,
  unreadCount,
  childCount,
  using24HourFormat,
  onPressChatThread,
  lastChatEntryState,
  connectionId,
}: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { t } = useTranslation()
  const connection = useConnectionById(connectionId)
  const hasChildren = childCount && childCount > 0
  const lastActivityDate = hasChildren ? lastChildActivityAt : lastActivityAt

  return (
    <TouchableOpacity activeOpacity={0.5} onPress={onPressChatThread} style={styles.container}>
      <Avatar
        uri={picture}
        label={topic}
        size="13%"
        bgAvatarInitials={theme.colors.secondary}
        enableImageRefresh={false}
      />
      <View style={styles.contentText}>
        <Text fontFamily="EuclidCircularA-Medium" style={styles.nameUser} numberOfLines={1}>
          {topic}
        </Text>
        {hasChildren ? (
          <Text style={styles.numberConversationText}>{`${childCount}  ${t('chat.conversations')}`}</Text>
        ) : connection ? (
          <Text numberOfLines={2} style={styles.textPreview}>
            {preview}
          </Text>
        ) : (
          <Text fontFamily="EuclidCircularA-Medium" style={styles.textPreview}>
            {t('personalChat.connectionDeleted')}
          </Text>
        )}
      </View>
      {hasChildren && (
        <View style={styles.containerIconChevron}>
          <SvgIcon name="chevronForward" fill={theme.colors.primaryText} />
        </View>
      )}
      <View style={styles.rightContent}>
        <Text style={styles.textDate}>
          {lastActivityDate ? chatDateFormat(lastActivityDate, using24HourFormat) : ''}
        </Text>
        <View style={styles.containerUnreadAndStateIcon}>
          {!hasChildren && lastChatEntryState && lastChatEntryState !== ChatEntryState.Deleted && (
            <MessageStateIcon theme={theme} state={lastChatEntryState} />
          )}
          {unreadCount > 0 && (
            <View style={styles.unread}>
              <Text fontFamily="EuclidCircularA-Medium" style={styles.textNumber}>
                {unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  )
}

export default memo(ChatThread)
