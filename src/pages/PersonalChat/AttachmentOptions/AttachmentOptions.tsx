import React from 'react'
import { useTranslation } from 'react-i18next'
import { View, TouchableOpacity } from 'react-native'
import { Video as VideoCompressor } from 'react-native-compressor'
import { stat } from 'react-native-fs'

import getStyles from './styles'

import { SvgIcon, Text } from '@2060/components/common'
import { IconsNames } from '@2060/components/common/SvgIcon'
import { IS_ANDROID } from '@2060/constants'
import { useImageCropPicker, ImageOrVideo, useChatActions } from '@2060/hooks'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { logError } from '@2060/utils'
import { deleteFile } from '@2060/utils/RNFS'

type Props = {
  closeAttachmentOptions(): void
  onCompressingVideoProgress: (progress: number) => void
}

const options = [
  { id: 'file-camera', icon: 'camera', label: 'camera' },
  { id: 'file-video', icon: 'video', label: 'takeVideo' },
  { id: 'file-gallery', icon: 'image', label: 'photoAndVideoLibrary' },
]

const AttachmentOptions: React.FC<Props> = ({ closeAttachmentOptions, onCompressingVideoProgress }) => {
  const { takePhotoOrVideo, takePhotoOrVideoFromGallery } = useImageCropPicker()
  const { shareMediaToDidComm } = useChatActions()
  const theme = useTheme()
  const styles = getStyles(theme)
  const { t } = useTranslation()

  const sendFile = async (fileInfo: ImageOrVideo) => {
    let mediaFileInfo = { ...fileInfo }
    if (IS_ANDROID && mediaFileInfo.mime.startsWith('video')) {
      mediaFileInfo = await compressVideo(mediaFileInfo)
    }
    shareMediaToDidComm({
      ...mediaFileInfo,
      duration: mediaFileInfo.duration ?? undefined,
      width: mediaFileInfo.width ?? undefined,
      height: mediaFileInfo.height ?? undefined,
    }).catch(logError)
  }

  const compressVideo = async (fileInfo: ImageOrVideo): Promise<ImageOrVideo> => {
    try {
      const compressedVideoPath = await VideoCompressor.compress(
        fileInfo.path,
        { compressionMethod: 'manual', bitrate: 691200, progressDivider: 5 },
        progress => onCompressingVideoProgress(Math.ceil(progress * 100)),
      )
      await deleteFile(fileInfo.path)
      fileInfo.path = compressedVideoPath
      const { size } = await stat(compressedVideoPath)
      fileInfo.size = size
    } catch (error) {
      logError(`Error compressing video: ${error}`)
    } finally {
      onCompressingVideoProgress(0)
      return fileInfo
    }
  }

  const onSelectedOption = async (optionId: string) => {
    closeAttachmentOptions()
    if (optionId === 'file-camera') {
      await takePhotoOrVideo(sendFile)
    }
    if (optionId === 'file-video') {
      await takePhotoOrVideo(sendFile, { mediaType: 'video' })
    }
    if (optionId === 'file-gallery') {
      await takePhotoOrVideoFromGallery(sendFile, { mediaType: 'any' })
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
