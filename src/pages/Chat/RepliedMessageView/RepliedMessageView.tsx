import { t } from 'i18next'
import React, { memo } from 'react'
import { View, TouchableOpacity, ImageBackground, ViewStyle } from 'react-native'

import getStyles from './styles'

import imagePlaceholder from '@2060/assets/images/placeholderImg.png'
import { SvgIcon, Text } from '@2060/components/common'
import { RepliedMessage, useChat } from '@2060/hooks/agent'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { ChatEntryRole, ChatEntryType } from '@2060/model'

type Props = {
  isInputToolbarView?: boolean
  repliedMessage: RepliedMessage
  onDismiss?(): void
  style?: ViewStyle
}

const RepliedMessageView: React.FC<Props> = memo(props => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { chatThread } = useChat()
  const { repliedMessage, onDismiss, isInputToolbarView = true, style } = props

  const participantName = chatThread?.participants.find(p => p.id === repliedMessage.role)?.name
  const repliedTo = repliedMessage.role === ChatEntryRole.Sender ? t('chat.you') : participantName
  const thumbnailSource = repliedMessage.thumbnail ? { uri: repliedMessage.thumbnail } : imagePlaceholder
  const isAudioOrVideo = [ChatEntryType.Video, ChatEntryType.Image].includes(repliedMessage.type)

  return (
    <View style={[styles.containerReply, style]}>
      <View style={styles.containerInfoUser}>
        <View style={styles.containerPreview}>
          <SvgIcon name="reply" width={17.12} height={17.12} fill={theme.colors.lightGrey} />
          <Text style={styles.replyTo} numberOfLines={1}>
            {repliedTo}
          </Text>
        </View>
        <View style={styles.containerPreview}>
          <Text style={styles.replyMsg} numberOfLines={1}>
            {repliedMessage.preview}
          </Text>
        </View>
      </View>
      {isAudioOrVideo && (
        <ImageBackground source={thumbnailSource} style={styles.imgThumbnail}>
          {repliedMessage.type === ChatEntryType.Video && (
            <SvgIcon name="playCircle" fill={theme.colors.primary} width={25} height={25} />
          )}
        </ImageBackground>
      )}
      {isInputToolbarView && (
        <TouchableOpacity onPress={onDismiss} style={styles.btnDismiss} activeOpacity={0.7}>
          <SvgIcon
            name="close"
            fill={theme.isDarkMode ? '#9CB1B7' : '#6A8994'}
            width={15.76}
            height={15.76}
          />
        </TouchableOpacity>
      )}
    </View>
  )
})

export default memo(RepliedMessageView)
