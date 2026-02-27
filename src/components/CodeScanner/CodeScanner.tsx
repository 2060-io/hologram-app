import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Dimensions, Platform, View } from 'react-native'
import {
  CameraRuntimeError,
  useCameraDevices,
  Camera,
  Code,
  useCodeScanner,
  useCameraFormat,
} from 'react-native-vision-camera'

import getStyles from './styles'

import { Text } from '@src/components/common'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { handleCameraPermission } from '@src/utils/permissions'
import { toast } from '@src/utils/toast'

const SCREEN_WIDTH = Dimensions.get('window').width
const SCREEN_HEIGHT = Platform.select<number>({
  android: Dimensions.get('screen').height, // - StaticSafeAreaInsets.safeAreaInsetsBottom,
  ios: Dimensions.get('window').height,
}) as number

interface Props {
  isActive: boolean
  onCodeScanned: (barcode: string) => void
}

const CodeScanner: React.FC<Props> = ({ isActive, onCodeScanned }) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean>()
  const scannedCodes = useRef<string[]>([])
  const devices = useCameraDevices()
  const device = devices.find(dev => dev.position === 'back')

  useEffect(() => {
    const requestCameraPermission = async () => {
      const cameraPermission = await handleCameraPermission()
      setHasCameraPermission(cameraPermission)
    }
    requestCameraPermission()
  }, [])

  useEffect(() => {
    scannedCodes.current = []
  }, [isActive])

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes: Code[]) => {
      const scannedCode = codes[0].value
      if (scannedCode) {
        const hasNotBeenScanned = !scannedCodes.current.includes(scannedCode)
        if (hasNotBeenScanned) onCodeScanned(scannedCode)
        scannedCodes.current = [...scannedCodes.current, scannedCode]
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

  // Camera callbacks
  const onError = useCallback((error: CameraRuntimeError) => {
    toast({ type: 'error', message: `${t('scan.errorReadingQRCode')}:${error.message}` })
  }, [])

  return (
    <React.Fragment>
      {device && isActive && hasCameraPermission ? (
        <Camera
          style={styles.camera}
          device={device}
          format={format}
          isActive={isActive}
          onError={onError}
          fps={fps}
          codeScanner={codeScanner}
          enableZoomGesture={true}
        />
      ) : (
        <View style={styles.containerLoadingCamera}>
          <Text fontFamily="EuclidCircularA-Medium" style={styles.loadingCameraText}>
            {t('scan.loadingCamera')}
          </Text>
        </View>
      )}
    </React.Fragment>
  )
}

export default CodeScanner
