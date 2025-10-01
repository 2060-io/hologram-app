import React, { useCallback } from 'react'
import { TouchableOpacity, View } from 'react-native'
import { GestureDetector } from 'react-native-gesture-handler'
import Reanimated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Camera as VisionCamera } from 'react-native-vision-camera'

import MediaResult from './MediaResult'
import { MediaCaptured } from './Props'
import getStyles from './styles'
import { useAnimatedStyles } from './useAnimatedStyles'
import { useCamera } from './useCamera'
import { useCameraPanGesture } from './useCameraPanGesture'

import { Icon, SvgIcon, Text } from '@2060/components/common'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { log, logError } from '@2060/utils'

const ReanimatedCamera = Reanimated.createAnimatedComponent(VisionCamera)
Reanimated.addWhitelistedNativeProps({
  zoom: true,
})

type Props = {
  isActive: boolean
  onMedia(media: MediaCaptured): void
  closeCamera(): void
  isVideoMode?: boolean
}

const Camera = ({ isActive, onMedia, closeCamera, isVideoMode = true }: Props) => {
  const insets = useSafeAreaInsets()
  const theme = useTheme()
  const styles = getStyles(theme, insets)

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
  } = useCamera({ isVideoMode, closeCamera })
  const { cameraPanGesture, exposure } = useCameraPanGesture({ device, isInitialized })
  const { cameraAnimatedProps, recordingStyle, buttonStyle } = useAnimatedStyles({
    isInitialized,
    cameraZoom,
    minZoom,
    maxZoom,
    isPressingButton,
  })

  const onPressSendButton = useCallback(async () => {
    if (mediaCaptured) onMedia(mediaCaptured)
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
      <TouchableOpacity onPress={onPressSendButton} style={styles.sendButton}>
        <Icon as="MaterialIcons" name="done" size={30} color={theme.colors.white} />
      </TouchableOpacity>
    )
  }, [onPressSendButton])

  const renderUpperButtons = () => {
    return (
      <>
        {closeButton()}
        {supportsFlash && (
          <TouchableOpacity onPress={handleFlash} style={styles.flashButton}>
            <Icon
              as="MaterialCommunityIcons"
              name={flash === 'on' ? 'flash' : 'flash-off'}
              size={30}
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
            {`${recordingProgress} / 01:00`}
          </Text>
        </View>
      </View>
    )
  }, [recordingProgress])

  return (
    <>
      {device ? (
        <View style={styles.container}>
          <GestureDetector gesture={cameraPanGesture}>
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
              video={isVideoMode}
              audio={isVideoMode}
              enableZoomGesture
              animatedProps={cameraAnimatedProps}
              lowLightBoost={device.supportsLowLightBoost}
              exposure={exposure}
            />
          </GestureDetector>
          {isRecordingVideo ? renderRecordingProgress() : renderUpperButtons()}
          <View style={styles.bottomButtonsContainer}>
            {!isRecordingVideo && (
              <TouchableOpacity style={styles.baseControlButton} onPress={getFileFromMedia}>
                <SvgIcon name="image" fill={theme.colors.white} width={30} height={30} />
              </TouchableOpacity>
            )}
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
            {!isRecordingVideo && (
              <TouchableOpacity style={styles.baseControlButton} onPress={flipCamera}>
                <SvgIcon name="flipCamera" fill={theme.colors.white} width={30} height={30} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      ) : null}
      <MediaResult
        visible={Boolean(mediaCaptured)}
        renderCloseButton={closeButton}
        renderSendButton={sendButton}
        mediaCaptured={mediaCaptured}
      />
    </>
  )
}

export default Camera
