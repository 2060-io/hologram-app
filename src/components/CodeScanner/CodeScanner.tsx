import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Dimensions, Platform, StyleSheet, View } from 'react-native'
import {
  CameraRuntimeError,
  useCameraDevices,
  Camera,
  Code,
  CameraPermissionStatus,
  useCodeScanner,
  useCameraFormat,
} from 'react-native-vision-camera'

import { Text } from '@2060/components/common'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { AppTheme } from '@2060/styles'
import { screenHeight } from '@2060/utils/responsiveUtils'
import { toast } from '@2060/utils/toast'

const SCREEN_WIDTH = Dimensions.get('window').width
const SCREEN_HEIGHT = Platform.select<number>({
  android: Dimensions.get('screen').height, // - StaticSafeAreaInsets.safeAreaInsetsBottom,
  ios: Dimensions.get('window').height,
}) as number

interface Props {
  camera: React.MutableRefObject<Camera | null | undefined>
  active: boolean
  onBarcodeScanned: (barcode: string) => void
}

const CodeScanner: React.FC<Props> = ({ camera, active, onBarcodeScanned }) => {
  const [cameraPermissionStatus, setCameraPermissionStatus] = useState<CameraPermissionStatus>()
  const devices = useCameraDevices()
  const device = devices.find(dev => dev.position === 'back')
  const theme = useTheme()
  const hasPermission = cameraPermissionStatus === 'granted'
  const { t } = useTranslation()
  const styles = getStyles(theme)
  const [scannedCodes, setScannedCodes] = useState<string[]>([])

  useEffect(() => {
    setScannedCodes([])
  }, [active])

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes: Code[]) => {
      if (codes.length && codes[0].value && !scannedCodes.includes(codes[0].value)) {
        setScannedCodes(prevScannedCodes => [...prevScannedCodes, codes[0].value ?? ''])
        onBarcodeScanned(codes[0].value)
      }
    },
  })

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

  const onRequestCameraPermission = async () => {
    await Camera.requestCameraPermission()
    setCameraPermissionStatus(Camera.getCameraPermissionStatus())
  }

  useEffect(() => {
    onRequestCameraPermission()
  }, [])

  // Camera callbacks
  const onError = useCallback((error: CameraRuntimeError) => {
    toast({ type: 'error', message: `${t('scan.errorReadingQRCode')}:${error.message}` })
  }, [])

  return (
    <React.Fragment>
      {device !== undefined && hasPermission ? (
        <Camera
          style={{ height: screenHeight, zIndex: -1 }}
          ref={ref => (camera.current = ref)}
          device={device}
          format={format}
          isActive={active}
          onError={onError}
          fps={fps}
          codeScanner={codeScanner}
          enableZoomGesture={true}
        />
      ) : (
        <View style={styles.containerLoadingCamera}>
          <Text typography="EuclidCircularA-Medium" style={styles.loadingCameraText}>
            {t('scan.loadingCamera')}
          </Text>
        </View>
      )}
    </React.Fragment>
  )
}

const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    containerLoadingCamera: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingCameraText: {
      color: theme.colors.primaryText,
      fontSize: theme.fontSize.xl,
      lineHeight: 20,
    },
  })

export default CodeScanner
