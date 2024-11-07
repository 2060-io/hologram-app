import React, { FC, PropsWithChildren, useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dimensions, Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { Svg, Rect } from 'react-native-svg'
import { Camera, runAtTargetFps, useCameraFormat, useFrameProcessor } from 'react-native-vision-camera'
import { useTextRecognition } from 'react-native-vision-camera-text-recognition'
import { Text as ResolvedText } from 'react-native-vision-camera-text-recognition/src/types'
import { Worklets } from 'react-native-worklets-core'

import { OutlinedGreenButton } from '../common'

import { MRZCameraProps } from './MRZScannerProps'
import styles from './styles'

const SCREEN_WIDTH = Dimensions.get('window').width
const SCREEN_HEIGHT = Platform.select<number>({
  android: Dimensions.get('screen').height, // - StaticSafeAreaInsets.safeAreaInsetsBottom,
  ios: Dimensions.get('window').height,
}) as number

const scanRegion = {
  left: 5,
  top: 40,
  width: 90,
  height: 10,
}

const MRZCamera: FC<PropsWithChildren<MRZCameraProps>> = ({
  onSkipPressed,
  cameraProps,
  onData,
  scanSuccess,
}) => {
  const { t } = useTranslation()
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
    { videoResolution: { width: 1280, height: 720 } },
    { photoAspectRatio: screenAspectRatio },
    { photoResolution: { width: 1280, height: 720 } },
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
        runAtTargetFps(1, () => {
          'worklet'
          const ocrData = scanText(frame, { scanRegion: { left: 5, top: 40, width: 90, height: 10 } })
          handleScanRunOnJS(ocrData)
        })
      }
    },
    [handleScanRunOnJS],
  )

  return (
    <>
      {device ? (
        <>
          <Camera
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={cameraProps?.isActive}
            ref={camera}
            format={format}
            fps={fps}
            frameProcessor={frameProcessor}
          />
          <Svg preserveAspectRatio="xMidYMid slice" style={StyleSheet.absoluteFill}>
            <Rect
              x={(scanRegion.left / 100) * screenWidth}
              y={(scanRegion.top / 100) * SCREEN_HEIGHT}
              width={(scanRegion.width / 100) * screenWidth}
              height={(scanRegion.height / 100) * SCREEN_HEIGHT}
              strokeWidth="2"
              stroke="red"
              fillOpacity={0}
            />
          </Svg>
        </>
      ) : undefined}
      <OutlinedGreenButton text={t('general.cancel')} onPress={onSkipPressed} style={styles.cancelButton} />
      {feedbackText ? (
        <View style={styles.feedbackContainer}>
          <Text style={styles.feedbackText}>{feedbackText}</Text>
        </View>
      ) : null}
    </>
  )
}

export default MRZCamera
