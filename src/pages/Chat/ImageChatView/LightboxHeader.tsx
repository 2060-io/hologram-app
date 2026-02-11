import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { View, TouchableOpacity, Alert } from 'react-native'
import { uses24HourClock } from 'react-native-localize'

import { MediaInfo } from '../ChatProps'

import getStyles from './styles'

import { Icon, Text } from '@2060/components/common'
import { useChatActions } from '@2060/hooks'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { ChatEntryMessage } from '@2060/pages/Chat/ChatMessage/Props'
import { getFormattedDateRangeWithTime } from '@2060/utils/dateUtils'

type LightboxHeaderProps = {
  fileMediaInfo: MediaInfo
  chatEntry: ChatEntryMessage
  onBack(): void
}

const Button = ({ iconName, onPress, color }: { iconName: string; onPress(): void; color: string }) => (
  <TouchableOpacity onPress={onPress}>
    <Icon as="Ionicons" name={iconName} size={30} color={color} />
  </TouchableOpacity>
)

const LightboxHeader = memo(({ fileMediaInfo, onBack, chatEntry }: LightboxHeaderProps) => {
  const { shareMediaToApp, saveFileToGallery, deleteMessagesForMe } = useChatActions()
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const using24HourFormat = uses24HourClock()
  const iconColor = theme.colors.tertiaryText

  const handleSaveFileToGallery = () => {
    saveFileToGallery(chatEntry)
      .then(() => Alert.alert(t('chat.saveSucceededFileMedia')))
      .catch(() => Alert.alert(t('chat.saveFailedFileMedia')))
  }

  const handleShareMediaToApp = () => {
    shareMediaToApp(chatEntry)
  }

  const handleMessageDelete = () => {
    deleteMessagesForMe([chatEntry])
    onBack()
  }

  return (
    <View style={styles.rootHeaderLightbox}>
      <View style={styles.containerHeaderLeft}>
        <Button iconName="arrow-back-circle-outline" onPress={onBack} color={iconColor} />
        <View style={styles.containerUserInfo}>
          <Text fontFamily="EuclidCircularA-Medium" style={styles.text}>
            {fileMediaInfo.sender?.name}
          </Text>
          <Text style={styles.text}>
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
