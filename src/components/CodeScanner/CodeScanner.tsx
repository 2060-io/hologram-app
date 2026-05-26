import { Text } from '@src/components/common'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { handleCameraPermission } from '@src/utils/permissions'
import { toast } from '@src/utils/toast'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { Camera, useCameraDevice } from 'react-native-vision-camera'
import { type Barcode, useBarcodeScannerOutput } from 'react-native-vision-camera-barcode-scanner'
import getStyles from './styles'

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
  const device = useCameraDevice('back')

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

  const barcodeOutput = useBarcodeScannerOutput({
    barcodeFormats: ['qr-code'],
    onBarcodeScanned: (barcodes: Barcode[]) => {
      const scannedCode = barcodes[0]?.displayValue
      if (scannedCode) {
        const hasNotBeenScanned = !scannedCodes.current.includes(scannedCode)
        if (hasNotBeenScanned) onCodeScanned(scannedCode)
        scannedCodes.current = [...scannedCodes.current, scannedCode]
      }
    },
    onError: useCallback((error: unknown) => {
      toast({ type: 'error', message: `${t('scan.errorReadingQRCode')}:${error}` })
    }, []),
  })

  return (
    <React.Fragment>
      {device && isActive && hasCameraPermission ? (
        <Camera
          style={styles.camera}
          device={device}
          isActive={isActive}
          outputs={[barcodeOutput]}
          enableNativeZoomGesture={true}
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
