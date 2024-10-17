import React, { FC, PropsWithChildren, useEffect, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useCameraDevices } from 'react-native-vision-camera'

import MRZCamera from './MRZCamera'
import { MRZScannerProps } from './MRZScannerProps'
import { findAndParseMrz } from './findAndParseMrz'

const MRZScanner: FC<PropsWithChildren<MRZScannerProps>> = ({ onMRZFinalResults, onSkipPressed }) => {
  const devices = useCameraDevices()
  const device = devices.find(dev => dev.position === 'back')
  const [isActive, setIsActive] = useState(true)
  const [scanSuccess, setScanSuccess] = useState(false)
  const scanSuccessAux = useRef(false)

  useEffect(() => {
    return () => {
      setIsActive(false)
    }
  }, [])

  const skipScan = () => {
    setIsActive(false)
    onSkipPressed()
  }

  const onData = (lines: string[]) => {
    const mrzResults = findAndParseMrz(lines)

    if (mrzResults && !scanSuccessAux.current) {
      scanSuccessAux.current = true
      setScanSuccess(true)
      setIsActive(false)
      onMRZFinalResults(mrzResults.lines)
    }
  }

  return (
    <View testID="scanDocumentView" style={StyleSheet.absoluteFill}>
      {device && isActive ? (
        <MRZCamera
          onData={onData}
          scanSuccess={scanSuccess}
          onSkipPressed={skipScan}
          cameraProps={{ device, isActive }}
        />
      ) : undefined}
    </View>
  )
}

export default MRZScanner
