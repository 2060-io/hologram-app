import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake'
import React, { useEffect, useRef, useState } from 'react'
import { useCameraDevices } from 'react-native-vision-camera'

import MRZCamera from './MRZCamera'
import { MRZScannerProps } from './MRZScannerProps'
import { findAndParseMrz } from './findAndParseMrz'

const MRZScanner = ({ onMRZFinalResults, onSkipPressed }: MRZScannerProps) => {
  const devices = useCameraDevices()
  const device = devices.find(dev => dev.position === 'back')
  const [isActive, setIsActive] = useState(true)
  const [scanSuccess, setScanSuccess] = useState(false)
  const scanSuccessAux = useRef(false)

  useEffect(() => {
    activateKeepAwakeAsync()
    return () => {
      deactivateKeepAwake()
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

  return device && isActive ? (
    <MRZCamera
      onData={onData}
      scanSuccess={scanSuccess}
      onSkipPressed={skipScan}
      cameraProps={{ device, isActive }}
    />
  ) : null
}

export default MRZScanner
