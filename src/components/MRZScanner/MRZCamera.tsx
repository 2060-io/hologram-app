import React, { FC, PropsWithChildren, useCallback, useMemo, useRef, useState } from 'react'
import { Button, Dimensions, Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { Camera, useCameraFormat, useFrameProcessor } from 'react-native-vision-camera'
import { useTextRecognition } from 'react-native-vision-camera-text-recognition'
import { Text as ResolvedText } from 'react-native-vision-camera-text-recognition/src/types'
import { Worklets } from 'react-native-worklets-core'

import { MRZCameraProps } from './MRZScannerProps'
import styles from './styles'

const SCREEN_WIDTH = Dimensions.get('window').width
const SCREEN_HEIGHT = Platform.select<number>({
  android: Dimensions.get('screen').height, // - StaticSafeAreaInsets.safeAreaInsetsBottom,
  ios: Dimensions.get('window').height,
}) as number

const MRZCamera: FC<PropsWithChildren<MRZCameraProps>> = ({
  onSkipPressed,
  cameraProps,
  onData,
  scanSuccess,
}) => {
  const camera = useRef<Camera>(null)
  const { width: screenWidth } = useWindowDimensions()
  const device = cameraProps?.device
  const [feedbackText, setFeedbackText] = useState<string>('')
  const { scanText } = useTextRecognition({ language: 'latin' })

  const screenAspectRatio = SCREEN_HEIGHT / SCREEN_WIDTH

  const supports60Fps = useMemo(() => device?.formats.some(f => f.maxFps >= 60), [device?.formats])
  const format = useCameraFormat(device, [
    { fps: supports60Fps ? 60 : 30 },
    { videoAspectRatio: screenAspectRatio },
    { videoResolution: 'max' },
    { photoAspectRatio: screenAspectRatio },
    { photoResolution: 'max' },
  ])

  const fps = Math.min(format?.maxFps ?? 1, supports60Fps ? 60 : 30)

  /**
   * Prevents sending copious amounts of scans
   */
  const handleScan = useCallback(
    (data: ResolvedText) => {
      if (data && data.blocks.length === 0) {
        setFeedbackText('')
      }
      /* Scanning the text from the image and then setting the state of the component. */
      if (data && data.blocks.length > 0) {
        data.blocks.forEach(block => {
          if (block.blockFrame.width / screenWidth < 0.8) {
            setFeedbackText('Hold Still')
          } else {
            setFeedbackText('Scanning...')
          }
        })

        let lines: string[] = []
        data.blocks.forEach(block => {
          lines.push(block.blockText)
        })
        if (lines.length > 0 && cameraProps.isActive && onData) {
          onData(lines)
        }
      }
    },
    [cameraProps.isActive, onData, screenWidth],
  )

  const handleScanRunOnJS = Worklets.createRunOnJS(handleScan)

  /* Using the useFrameProcessor hook to process the video frames. */
  const frameProcessor = useFrameProcessor(
    frame => {
      'worklet'
      if (!scanSuccess) {
        const ocrData = scanText(frame)
        handleScanRunOnJS(ocrData)
      }
    },
    [handleScanRunOnJS],
  )

  return (
    <View style={StyleSheet.absoluteFill}>
      {device ? (
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={cameraProps?.isActive}
          ref={camera}
          format={format}
          fps={fps}
          frameProcessor={frameProcessor}
        />
      ) : undefined}
      <View style={styles.skipButtonContainer}>
        <Button title={'Skip'} onPress={onSkipPressed} />
      </View>
      {feedbackText ? (
        <View style={styles.feedbackContainer}>
          <Text style={styles.feedbackText}>{feedbackText}</Text>
        </View>
      ) : null}
    </View>
  )
}

export default MRZCamera
