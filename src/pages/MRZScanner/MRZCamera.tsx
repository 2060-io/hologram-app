import { HeaderTitle, SvgIcon, Text } from '@src/components/common'
import { IS_IOS } from '@src/constants'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { widthPercentageToDP } from '@src/utils/responsiveUtils'
import React, { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dimensions, LayoutChangeEvent, Platform, StyleSheet, TouchableOpacity, View } from 'react-native'
import { Rect, Svg } from 'react-native-svg'
import { Camera, type CameraRef, useFrameOutput } from 'react-native-vision-camera'
import { type Text as ResolvedText, type ScanRegion, useTextRecognition } from 'react-native-vision-camera-ocr-plus'
import { scheduleOnRN } from 'react-native-worklets'
import { MRZCameraProps } from './MRZScannerProps'
import getStyles from './styles'

const SCREEN_WIDTH = Dimensions.get('window').width
const SCREEN_HEIGHT = Platform.select<number>({
  android: Dimensions.get('screen').height, // - StaticSafeAreaInsets.safeAreaInsetsBottom,
  ios: Dimensions.get('window').height,
}) as number

const scanRegion: ScanRegion = {
  left: '5%',
  top: '28%',
  width: '90%',
  height: '24%',
}

const MRZCamera = ({ skipScan, cameraProps, onData, scanSuccess, refuse }: MRZCameraProps) => {
  const { t } = useTranslation()
  const camera = useRef<CameraRef>(null)
  const { device, isActive } = cameraProps
  const theme = useTheme()
  const styles = getStyles(theme)
  const { scanText } = useTextRecognition({
    language: 'latin',
    frameSkipThreshold: IS_IOS ? 5 : 1,
    useLightweightMode: true,
    scanRegion,
  })
  const [containerHeight, setContainerHeight] = useState(0)

  /**
   * Prevents sending copious amounts of scans
   */
  const handleScan = useCallback(
    (data: ResolvedText) => {
      /* Scanning the text from the image and then setting the state of the component. */
      if (data && data.blocks.length > 0) {
        const lines: string[] = []
        data.blocks.forEach((block) => {
          lines.push(block.blockText)
        })
        if (lines.length > 0 && isActive) onData(lines)
      }
    },
    [isActive, onData]
  )

  const frameOutput = useFrameOutput({
    pixelFormat: 'rgb',
    onFrame: (frame) => {
      'worklet'
      if (!scanSuccess) {
        const ocrData = scanText(frame)
        scheduleOnRN(handleScan, ocrData)
      }
      frame.dispose()
    },
  })

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
          outputs={[frameOutput]}
        />
        <Svg preserveAspectRatio="xMidYMid slice" style={StyleSheet.absoluteFill}>
          <Rect
            x={0}
            y={(parseFloat(scanRegion.top) / 100) * containerHeight}
            width={'100%'}
            height={(parseFloat(scanRegion.height) / 100) * containerHeight}
            strokeWidth="3"
            stroke={theme.colors.green}
            fillOpacity={0}
          />
        </Svg>
      </View>
      <View style={{ ...styles.topOverlayContainer, height: containerHeight * 0.28 }}>
        <View style={styles.headerContainer}>
          <TouchableOpacity style={styles.headerLeft} onPress={skipScan}>
            <Text fontFamily="EuclidCircularA-Medium" style={styles.headerBtnText}>
              {t('general.cancel')}
            </Text>
          </TouchableOpacity>
          <HeaderTitle title={t('chat.mrzRequest')} theme={theme} />
        </View>
        <Text fontFamily="EuclidCircularA-Bold" style={styles.title}>
          {t('chat.mrzScanTitle')}
        </Text>
        <Text style={styles.instructions}>{t('chat.mrzScanInst')}</Text>
      </View>
      <View style={{ ...styles.bottomOverlayContainer, height: containerHeight * 0.48 }}>
        <SvgIcon name="MRZ" height={widthPercentageToDP('43')} width={widthPercentageToDP('72')} />
        <TouchableOpacity onPress={refuse}>
          <Text fontFamily="EuclidCircularA-Medium" style={styles.refuse}>
            {t('general.refuse')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default MRZCamera
