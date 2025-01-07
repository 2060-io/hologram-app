import React, { memo } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { uses24HourClock } from 'react-native-localize'

import { MediaInfo } from '../PersonalChatProps'

import getStyles from './styles'

import { Icon, Text } from '@2060/components/common'
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

const Button = ({ iconName, onPress, color }: { iconName: string; onPress(): void; color: string }) => (
  <TouchableOpacity onPress={onPress}>
    <Icon as="Ionicons" name={iconName} size={30} color={color} />
  </TouchableOpacity>
)

const LightboxHeader = memo(({ fileMediaInfo, onBack, currentMessage }: LightboxHeaderProps) => {
  const { shareMediaToApp, onSaveFileToGallery, deleteMessagesForMe } = useChatActions()
  const theme = useTheme()
  const styles = getStyles(theme)
  const using24HourFormat = uses24HourClock()
  const iconColor = theme.colors.tertiaryText

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
        <Button iconName="arrow-back-circle-outline" onPress={onBack} color={iconColor} />
        <View style={styles.containerUserInfo}>
          <Text typography="EuclidCircularA-Medium" style={styles.text}>
            {fileMediaInfo.user?.name}
          </Text>
          <Text typography="EuclidCircularA-Regular" style={styles.text}>
            {getFormattedDateRangeWithTime(new Date(fileMediaInfo.createdAt), using24HourFormat)}
          </Text>
        </View>
      </View>
      <View style={styles.containerHeaderRight}>
        <Button iconName="cloud-download-outline" onPress={handleSaveFileToGallery} color={iconColor} />
        <Button iconName="share-social-outline" onPress={handleShareMediaToApp} color={iconColor} />
        <Button iconName="trash-outline" onPress={handleMessageDelete} color={iconColor} />
      </View>
    </View>
  )
})

export default LightboxHeader
