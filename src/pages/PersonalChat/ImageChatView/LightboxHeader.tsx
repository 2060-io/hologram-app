import React, { memo } from 'react'
import { View, Pressable, TouchableOpacity } from 'react-native'
import { uses24HourClock } from 'react-native-localize'

import { MediaInfo } from '../PersonalChatProps'

import getStyles from './styles'

import { Icon, Text } from '@2060/components/common'
import { whiteColor } from '@2060/constants'
import { useChatActions } from '@2060/hooks'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { ChatEntryMessage } from '@2060/pages/PersonalChat/ChatMessage/Props'
import { log } from '@2060/utils'
import { getFormattedDateRangeWithTime } from '@2060/utils/dateUtils'

type LightboxHeaderProps = {
  fileMediaInfo: MediaInfo
  currentMessage: ChatEntryMessage
  onBack(): void
}

const ButtomTouchable = ({ iconName, onPress }: { iconName: string; onPress(): void }) => (
  <TouchableOpacity activeOpacity={0.6} onPress={onPress}>
    <Icon as="Ionicons" name={iconName} size={30} color={whiteColor} />
  </TouchableOpacity>
)

const LightboxHeader = memo(({ fileMediaInfo, onBack, currentMessage }: LightboxHeaderProps) => {
  const { shareMediaToApp, onSaveFileToGallery, deleteMessagesForMe } = useChatActions()
  const theme = useTheme()
  const styles = getStyles(theme)
  const using24HourFormat = uses24HourClock()

  const handleSaveFileToGallery = () => {
    onSaveFileToGallery(currentMessage).then(() => {
      onBack()
    })
  }

  const handleShareMediaToApp = () => {
    shareMediaToApp(currentMessage)
      .then(() => onBack())
      .catch(log)
  }

  const handleMessageDelete = () => {
    deleteMessagesForMe([currentMessage])
    onBack()
  }

  return (
    <View style={styles.rootHeaderLightbox}>
      <View style={styles.containerHeaderLeft}>
        <Pressable
          onPress={onBack}
          android_ripple={{ foreground: true, color: whiteColor, borderless: true, radius: 20 }}
        >
          <Icon as="Ionicons" name="arrow-back-circle-outline" size={30} color={whiteColor} />
        </Pressable>
        <View style={styles.containerUserInfo}>
          <Text typography="SFPro-Medium" style={styles.textUserName}>
            {fileMediaInfo.user?.name}
          </Text>
          <Text style={styles.textDateReceived}>
            {getFormattedDateRangeWithTime(new Date(fileMediaInfo.createdAt), using24HourFormat)}
          </Text>
        </View>
      </View>
      <View style={styles.containerHeaderRight}>
        <ButtomTouchable iconName="cloud-download-outline" onPress={handleSaveFileToGallery} />
        <ButtomTouchable iconName="share-social-outline" onPress={handleShareMediaToApp} />
        <ButtomTouchable iconName="trash-outline" onPress={handleMessageDelete} />
      </View>
    </View>
  )
})

export default LightboxHeader
