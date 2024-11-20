import React, { useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dimensions, LayoutChangeEvent, Platform, StyleSheet, TouchableOpacity, View } from 'react-native'
import { Svg, Rect } from 'react-native-svg'
import { Camera, runAtTargetFps, useCameraFormat, useFrameProcessor } from 'react-native-vision-camera'
import { useTextRecognition } from 'react-native-vision-camera-text-recognition'
import { Text as ResolvedText, ScanRegion } from 'react-native-vision-camera-text-recognition/src/types'
import { Worklets } from 'react-native-worklets-core'

import { MRZCameraProps } from './MRZScannerProps'
import getStyles from './styles'

import { HeaderTitle, SvgIcon, Text } from '@2060/components/common'
import { IS_DEVICE_IOS } from '@2060/constants'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { widthPercentageToDP } from '@2060/utils/responsiveUtils'

const SCREEN_WIDTH = Dimensions.get('window').width
const SCREEN_HEIGHT = Platform.select<number>({
  android: Dimensions.get('screen').height, // - StaticSafeAreaInsets.safeAreaInsetsBottom,
  ios: Dimensions.get('window').height,
}) as number

const scanRegion: ScanRegion = {
  left: 5,
  top: 28,
  width: 90,
  height: 24,
}
const RUN_TARGET_FPS = IS_DEVICE_IOS ? 5 : 1

const MRZCamera = ({ skipScan, cameraProps, onData, scanSuccess }: MRZCameraProps) => {
  const { t } = useTranslation()
  const camera = useRef<Camera>(null)
  const { device, isActive } = cameraProps
  const screenAspectRatio = SCREEN_HEIGHT / SCREEN_WIDTH
  const theme = useTheme()
  const styles = getStyles(theme)
  const { scanText } = useTextRecognition({ language: 'latin', scanRegion })
  const [containerHeight, setContainerHeight] = useState(0)
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
      /* Scanning the text from the image and then setting the state of the component. */
      if (data && data.blocks.length > 0) {
        let lines: string[] = []
        data.blocks.forEach(block => {
          lines.push(block.blockText)
        })
        if (lines.length > 0 && isActive && onData) {
          onData(lines)
        }
      }
    },
    [isActive, onData],
  )

  const handleScanRunOnJS = Worklets.createRunOnJS(handleScan)

  /* Using the useFrameProcessor hook to process the video frames. */
  const frameProcessor = useFrameProcessor(
    frame => {
      'worklet'
      if (!scanSuccess) {
        runAtTargetFps(RUN_TARGET_FPS, () => {
          'worklet'
          const ocrData = scanText(frame)
          handleScanRunOnJS(ocrData)
        })
      }
    },
    [handleScanRunOnJS],
  )

  const onLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout
    setContainerHeight(height)
  }

  return (
    <View style={styles.container} onLayout={onLayout}>
      <View style={styles.cameraContainer}>
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
            x={0}
            y={(scanRegion.top / 100) * containerHeight}
            width={'100%'}
            height={(scanRegion.height / 100) * containerHeight}
            strokeWidth="3"
            stroke={theme.colors.green}
            fillOpacity={0}
          />
        </Svg>
      </View>
      <View style={{ ...styles.topOverlayContainer, height: containerHeight * 0.28 }}>
        <View style={styles.headerContainer}>
          <TouchableOpacity style={styles.headerLeft} onPress={skipScan}>
            <Text typography="EuclidCircularA-Medium" style={styles.headerBtnText}>
              {t('general.cancel')}
            </Text>
          </TouchableOpacity>
          <HeaderTitle title={t('chat.mrzRequest')} theme={theme} />
        </View>
        <Text typography="EuclidCircularA-Bold" style={styles.title}>
          {t('chat.mrzScanTitle')}
        </Text>
        <Text typography="EuclidCircularA-Regular" style={styles.instructions}>
          {t('chat.mrzScanInst')}
        </Text>
      </View>
      <View style={{ ...styles.bottomOverlayContainer, height: containerHeight * 0.48 }}>
        <SvgIcon name="MRZ" height={widthPercentageToDP('43')} width={widthPercentageToDP('72')} />
        <TouchableOpacity onPress={skipScan}>
          <Text typography="EuclidCircularA-Medium" style={styles.refuse}>
            {t('general.refuse')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default MRZCamera
