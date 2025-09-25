import { useIsFocused } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import CompressingVideo from './CompressingVideo'

import { Camera as BaseCamera } from '@2060/components'
import { MediaCaptured } from '@2060/components/Camera/useCamera'
import { PersonalChatStackParams } from '@2060/components/Navigation/NavigationProps'
import { IS_ANDROID, IS_IOS } from '@2060/constants'
import { useAppState, useChatActions } from '@2060/hooks'
import { DidCommMediaFileSharingData } from '@2060/hooks/agent'
import { createDidCommPreview, createResizedImage } from '@2060/hooks/media/preview'
import { logError } from '@2060/utils'
import { deleteFile } from '@2060/utils/RNFS'
import { cancelVideoCompression, compressVideo, getMediaInfo } from '@2060/utils/mediaFileUtils'
import { toast } from '@2060/utils/toast'

const resizeImageOptions = {
  maxWidth: 1280,
  maxHeight: 720,
  quality: 100,
}

export interface Props extends StackScreenProps<PersonalChatStackParams, 'Camera'> {}
const Camera = ({ navigation }: Props) => {
  const { t } = useTranslation()
  const [isActive, setIsActive] = useState(false)
  const isFocused = useIsFocused()
  const { isAppActive } = useAppState()
  const { shareMediaToDidComm } = useChatActions()
  const [compressingVideoProgress, setCompressingVideoProgress] = useState(0)
  const videoCompressionCancellationId = useRef<string>('')

  useEffect(() => {
    setIsActive(isFocused && isAppActive)
  }, [isFocused, isAppActive])

  const closeCamera = useCallback(() => {
    navigation.goBack()
  }, [])

  const cancelCompression = () => {
    cancelVideoCompression(videoCompressionCancellationId.current)
  }

  const getVideoCompressionCancellationId = (cancellationId: string) => {
    videoCompressionCancellationId.current = cancellationId
  }

  const sendMedia = useCallback(async (mediaCaptured: MediaCaptured) => {
    try {
      const { type, height, width, duration, origin } = mediaCaptured
      const isImage = type === 'image'
      if (isImage) {
        const resizedImage = await createResizedImage({ imageUrl: mediaCaptured.path, ...resizeImageOptions })
        if (resizedImage) {
          await deleteFile(mediaCaptured.path)
          mediaCaptured.path = IS_IOS ? resizedImage.path : `file://${resizedImage.path}`
        }
      }
      const { size, mimeType } = await getMediaInfo(mediaCaptured.path)
      const preview = await createDidCommPreview({
        localFilePath: mediaCaptured.path,
        mimeType,
      })
      const isVideo = type === 'video'
      let didCommMediaFileSharingData: DidCommMediaFileSharingData = {
        path: mediaCaptured.path,
        mime: mimeType,
        preview,
        size,
        width,
        height,
        ...(isVideo && { duration }),
      }
      const mustCompressVideo =
        isVideo && (origin === 'vision-camera' || (IS_ANDROID && origin === 'image-crop-picker'))
      if (mustCompressVideo) {
        didCommMediaFileSharingData = await compressVideo(
          didCommMediaFileSharingData,
          setCompressingVideoProgress,
          getVideoCompressionCancellationId,
        )
      }
      shareMediaToDidComm({ ...didCommMediaFileSharingData }).catch(logError)
      closeCamera()
    } catch (error) {
      toast({ type: 'error', message: t('signUp.anErrorHasOccurred') })
      logError(`Error sending media: ${error}`)
    }
  }, [])

  return (
    <>
      <BaseCamera isActive={isActive} onMedia={sendMedia} closeCamera={closeCamera} />
      {compressingVideoProgress > 0 && (
        <CompressingVideo progress={compressingVideoProgress} cancelCompression={cancelCompression} />
      )}
    </>
  )
}

export default Camera
