import { useIsFocused } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { TouchableOpacity, View } from 'react-native'
import { GestureDetector } from 'react-native-gesture-handler'
import Reanimated from 'react-native-reanimated'
import { Camera as VisionCamera } from 'react-native-vision-camera'

import { CompressingVideo } from '../PersonalChat/components'

import MediaResult from './MediaResult'
import getStyles from './styles'
import { useAnimatedStyles } from './useAnimatedStyles'
import { useCamera } from './useCamera'

import { PersonalChatStackParams } from '@2060/components/Navigation/NavigationProps'
import { Icon, SvgIcon, Text } from '@2060/components/common'
import { IS_ANDROID, IS_IOS } from '@2060/constants'
import { useAppState, useChatActions } from '@2060/hooks'
import { DidCommMediaFileSharingData } from '@2060/hooks/agent'
import { createDidCommPreview, createResizedImage } from '@2060/hooks/media/preview'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { log, logError } from '@2060/utils'
import { deleteFile } from '@2060/utils/RNFS'
import { cancelVideoCompression, compressVideo } from '@2060/utils/mediaFileUtils'

const resizeImageOptions = {
  maxWidth: 1280,
  maxHeight: 720,
  quality: 100,
}

const ReanimatedCamera = Reanimated.createAnimatedComponent(VisionCamera)
Reanimated.addWhitelistedNativeProps({
  zoom: true,
})

export interface Props extends StackScreenProps<PersonalChatStackParams, 'Camera'> {}
const Camera = ({ navigation }: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const [isActive, setIsActive] = useState(false)
  const isFocused = useIsFocused()
  const { isAppActive } = useAppState()
  const { shareMediaToDidComm } = useChatActions()
  const [compressingVideoProgress, setCompressingVideoProgress] = useState(0)
  const videoCompressionCancellationId = useRef<string>('')

  useEffect(() => {
    setIsActive(isFocused && isAppActive)
  }, [isFocused, isAppActive])

  const {
    camera,
    device,
    format,
    fps,
    onInitialized,
    close,
    flash,
    handleFlash,
    flipCamera,
    mediaCaptured,
    tapGesture,
    panGesture,
    isInitialized,
    cameraZoom,
    minZoom,
    maxZoom,
    supportsFlash,
    getFileFromMedia,
    isPressingButton,
    isRecordingVideo,
    recordingProgress,
  } = useCamera({ navigation })
  const { cameraAnimatedProps, recordingStyle, buttonStyle } = useAnimatedStyles({
    isInitialized,
    cameraZoom,
    minZoom,
    maxZoom,
    isPressingButton,
  })

  const cancelCompression = () => {
    cancelVideoCompression(videoCompressionCancellationId.current)
  }

  const getVideoCompressionCancellationId = (cancellationId: string) => {
    videoCompressionCancellationId.current = cancellationId
  }

  const sendMedia = useCallback(async () => {
    try {
      if (!mediaCaptured) return
      const { type, height, width, duration, origin } = mediaCaptured
      const isImage = type === 'image'
      if (isImage) {
        const resizedImage = await createResizedImage({ imageUrl: mediaCaptured.path, ...resizeImageOptions })
        if (resizedImage) {
          await deleteFile(mediaCaptured.path)
          mediaCaptured.path = IS_IOS ? resizedImage.path : `file://${resizedImage.path}`
        }
      }
      const mediaRequest = await fetch(mediaCaptured.path)
      const { size, type: mimeType } = await mediaRequest.blob()
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
      navigation.goBack()
    } catch (error) {
      logError(`Error sending photo: ${error}`)
    }
  }, [mediaCaptured])

  const closeButton = useCallback(() => {
    return (
      <TouchableOpacity onPress={close} style={styles.closeButton}>
        <SvgIcon name="close" fill={theme.colors.white} width={30} height={30} />
      </TouchableOpacity>
    )
  }, [close])

  const sendButton = useCallback(() => {
    return (
      <TouchableOpacity onPress={sendMedia} style={styles.sendButton}>
        <SvgIcon name="send" fill={theme.colors.white} height={30} width={30} />
      </TouchableOpacity>
    )
  }, [sendMedia])

  const renderUpperButtons = () => {
    return (
      <>
        {closeButton()}
        {supportsFlash && (
          <TouchableOpacity onPress={handleFlash} style={styles.flashButton}>
            <Icon
              as="MaterialCommunityIcons"
              name={flash === 'on' ? 'flash' : 'flash-off'}
              size={40}
              color={theme.colors.white}
            />
          </TouchableOpacity>
        )}
      </>
    )
  }

  const renderRecordingProgress = useCallback(() => {
    return (
      <View style={styles.recordingTimeContainer}>
        <View style={styles.recordingTime}>
          <Text typography="EuclidCircularA-SemiBold" style={styles.recordingTimeText}>
            {recordingProgress}
          </Text>
        </View>
      </View>
    )
  }, [recordingProgress])

  return (
    <>
      {device ? (
        <View style={styles.container}>
          <ReanimatedCamera
            style={styles.container}
            device={device}
            isActive={isActive}
            ref={camera}
            onInitialized={onInitialized}
            onError={error => logError('Vision Camera error:', error)}
            onStarted={() => log('Vision Camera started!')}
            onStopped={() => log('Vision Camera stopped!')}
            onPreviewStarted={() => log('Preview started!')}
            onPreviewStopped={() => log('Preview stopped!')}
            onOutputOrientationChanged={o => log(`Output orientation changed to ${o}!`)}
            onPreviewOrientationChanged={o => log(`Preview orientation changed to ${o}!`)}
            onUIRotationChanged={degrees => log(`UI Rotation changed: ${degrees}°`)}
            format={format}
            fps={fps}
            photo
            video
            audio
            enableZoomGesture
            animatedProps={cameraAnimatedProps}
            lowLightBoost={device.supportsLowLightBoost}
          />
          {isRecordingVideo ? renderRecordingProgress() : renderUpperButtons()}
          <View style={styles.bottomButtonsContainer}>
            <TouchableOpacity onPress={getFileFromMedia} disabled={isRecordingVideo}>
              <SvgIcon
                name="image"
                fill={isRecordingVideo ? 'transparent' : theme.colors.white}
                width={40}
                height={40}
              />
            </TouchableOpacity>
            <GestureDetector gesture={tapGesture}>
              <Reanimated.View style={buttonStyle}>
                <GestureDetector gesture={panGesture}>
                  <Reanimated.View>
                    <Reanimated.View style={[styles.recordingVideo, recordingStyle]} />
                    <View style={styles.mainButton} />
                  </Reanimated.View>
                </GestureDetector>
              </Reanimated.View>
            </GestureDetector>
            <TouchableOpacity onPress={flipCamera} disabled={isRecordingVideo}>
              <SvgIcon
                name="flipCamera"
                fill={isRecordingVideo ? 'transparent' : theme.colors.white}
                width={40}
                height={40}
              />
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
      <MediaResult
        visible={Boolean(mediaCaptured)}
        renderCloseButton={closeButton}
        renderSendButton={sendButton}
        mediaCaptured={mediaCaptured}
      />
      {compressingVideoProgress > 0 && (
        <CompressingVideo progress={compressingVideoProgress} cancelCompression={cancelCompression} />
      )}
    </>
  )
}

export default Camera
