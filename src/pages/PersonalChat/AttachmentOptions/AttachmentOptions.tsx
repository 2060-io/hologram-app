import React from 'react'
import { useTranslation } from 'react-i18next'
import { View, TouchableOpacity, Keyboard } from 'react-native'

import getStyles from './styles'

import { SvgIcon, Text } from '@2060/components/common'
import { IconsNames } from '@2060/components/common/SvgIcon'
import { IS_ANDROID } from '@2060/constants'
import { useImageCropPicker, ImageOrVideo, useChatActions } from '@2060/hooks'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { logError } from '@2060/utils'
import { compressVideo } from '@2060/utils/mediaFileUtils'

type Props = {
  closeAttachmentOptions(): void
  onCompressingVideoProgress: (progress: number) => void
  getVideoCompressionCancellationId: (cancellationId: string) => void
}

const options = [
  { id: 'file-camera', icon: 'camera', label: 'camera' },
  { id: 'file-video', icon: 'video', label: 'takeVideo' },
  { id: 'file-gallery', icon: 'image', label: 'photoAndVideoLibrary' },
]

const AttachmentOptions: React.FC<Props> = ({
  closeAttachmentOptions,
  onCompressingVideoProgress,
  getVideoCompressionCancellationId,
}) => {
  const { takePhotoOrVideo, takePhotoOrVideoFromGallery } = useImageCropPicker()
  const { shareMediaToDidComm } = useChatActions()
  const theme = useTheme()
  const styles = getStyles(theme)
  const { t } = useTranslation()

  const onMediaFile = async (fileInfo: ImageOrVideo) => {
    closeAttachmentOptions()
    let mediaFileInfo: ImageOrVideo | null = { ...fileInfo }
    const isVideo = mediaFileInfo.mime.startsWith('video')
    if (IS_ANDROID && isVideo) {
      Keyboard.dismiss()
      mediaFileInfo = (await compressVideo(
        mediaFileInfo,
        onCompressingVideoProgress,
        getVideoCompressionCancellationId,
      )) as ImageOrVideo | null
    }
    if (mediaFileInfo) {
      shareMediaToDidComm({
        ...mediaFileInfo,
        duration: mediaFileInfo.duration ?? undefined,
        width: mediaFileInfo.width ?? undefined,
        height: mediaFileInfo.height ?? undefined,
      }).catch(logError)
    }
  }

  const onSelectedOption = async (optionId: string) => {
    if (optionId === 'file-camera') {
      await takePhotoOrVideo(onMediaFile)
    }
    if (optionId === 'file-video') {
      await takePhotoOrVideo(onMediaFile, { mediaType: 'video' })
    }
    if (optionId === 'file-gallery') {
      await takePhotoOrVideoFromGallery(onMediaFile, { mediaType: 'any' })
    }
  }

  return (
    <View style={styles.subContainer}>
      {options.map(option => (
        <View style={styles.containerOptionCard} key={option.id}>
          <TouchableOpacity
            style={styles.containerOption}
            activeOpacity={0.9}
            onPress={() => onSelectedOption(option.id)}
          >
            <SvgIcon name={option.icon as keyof IconsNames} fill={theme.colors.primaryText} />
            <Text typography="EuclidCircularA-Regular" style={styles.optionText}>
              {t(`personalChat.${option.label}`)}
            </Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  )
}

export default AttachmentOptions
