import { ParamListBase } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { View, TouchableOpacity, Keyboard } from 'react-native'

import getStyles from './styles'

import { SvgIcon, Text } from '@src/components/common'
import { IconsNames } from '@src/components/common/SvgIcon'
import { IS_ANDROID } from '@src/constants'
import { useImageCropPicker, ImageOrVideo, useChatActions } from '@src/hooks'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { logError } from '@src/utils'
import { compressVideo } from '@src/utils/mediaFileUtils'

type Props = {
  closeAttachmentOptions(): void
  onCompressingVideoProgress: (progress: number) => void
  getVideoCompressionCancellationId: (cancellationId: string) => void
  navigation: StackNavigationProp<ParamListBase>
  connectionId: string
}
type OptionId = 'file-camera' | 'file-video' | 'file-gallery' | 'present-credentials'
type Option = { id: OptionId; icon: keyof IconsNames }

const options: Option[] = [
  { id: 'file-camera', icon: 'camera' },
  { id: 'file-video', icon: 'video' },
  { id: 'file-gallery', icon: 'image' },
  { id: 'present-credentials', icon: 'id' },
]

const AttachmentOptions: React.FC<Props> = ({
  closeAttachmentOptions,
  onCompressingVideoProgress,
  getVideoCompressionCancellationId,
  navigation,
  connectionId,
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

  const onSelectedOption: Record<OptionId, () => Promise<void> | void> = {
    'file-camera': async () => await takePhotoOrVideo(onMediaFile),
    'file-video': async () => await takePhotoOrVideo(onMediaFile, { mediaType: 'video' }),
    'file-gallery': async () => await takePhotoOrVideoFromGallery(onMediaFile, { mediaType: 'any' }),
    'present-credentials': () => {
      closeAttachmentOptions()
      navigation.navigate('PresentCredentialsFromChat', { connectionId })
    },
  }

  const label: Record<OptionId, string> = {
    'file-camera': t('chat.camera'),
    'file-video': t('chat.takeVideo'),
    'file-gallery': t('chat.photoAndVideoLibrary'),
    'present-credentials': t('credential.present'),
  }

  return (
    <View style={styles.container}>
      {options.map(option => (
        <View style={styles.containerOptionCard} key={option.id}>
          <TouchableOpacity style={styles.containerOption} onPress={onSelectedOption[option.id]}>
            <SvgIcon name={option.icon} fill={theme.colors.primaryText} />
            <Text style={styles.optionText}>{label[option.id]}</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  )
}

export default AttachmentOptions
