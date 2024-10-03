import React, { FC, PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { Camera, useFrameProcessor } from 'react-native-vision-camera'
import { useTextRecognition } from 'react-native-vision-camera-text-recognition'
import { Text as ResolvedText } from 'react-native-vision-camera-text-recognition/src/types'
import { Worklets } from 'react-native-worklets-core'

import { sortFormatsByResolution } from './generalUtil'
import { MRZCameraProps } from './types'

const MRZCamera: FC<PropsWithChildren<MRZCameraProps>> = ({
  onSkipPressed,
  cameraProps,
  onData,
  scanSuccess,
  skipButtonText,
}) => {
  const camera = useRef<Camera>(null)
  const { height: screenHeight, width: screenWidth } = useWindowDimensions()
  const device = cameraProps?.device
  const formats = useMemo(() => device?.formats.sort(sortFormatsByResolution), [device?.formats])
  const [format, setFormat] = useState(formats && formats.length > 0 ? formats[0] : undefined)
  const [feedbackText, setFeedbackText] = useState<string>('')

  /**
   * Prevents sending copious amounts of scans
   */
  const handleScan = useCallback(
    (data: ResolvedText) => {
      if (data && data.blocks && data.blocks.length === 0) {
        setFeedbackText('')
      }
      /* Scanning the text from the image and then setting the state of the component. */
      if (data && data.blocks && data.blocks.length > 0) {
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

  /* Setting the format to the first format in the formats array. */
  useEffect(() => {
    setFormat(formats && formats.length > 0 ? formats[0] : undefined)
  }, [device])

  const { scanText } = useTextRecognition({ language: 'latin' })

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

  const styles = StyleSheet.create({
    fixToText: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    skipButtonContainer: {
      position: 'absolute',
      bottom: screenHeight * 0.05,
      width: screenWidth,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    },
    feedbackContainer: {
      position: 'absolute',
      top: screenHeight * 0.3,
      width: screenWidth,
      alignItems: 'center',
    },
    feedbackText: {
      backgroundColor: 'white',
      color: 'black',
      fontSize: 18,
      paddingRight: 8,
      paddingLeft: 8,
      textAlign: 'center',
    },
  })

  return (
    <View style={StyleSheet.absoluteFill}>
      {device ? (
        <Camera
          style={cameraProps?.style ?? StyleSheet.absoluteFill}
          device={cameraProps?.device ?? device}
          torch={cameraProps?.torch}
          isActive={cameraProps?.isActive}
          /*
          codeScanner={{
            regionOfInterest: { x: 0, y: 0, width: screenWidth, height: 100 },
            codeTypes: ['ean-13'],
          }}
          */
          ref={camera}
          photo={cameraProps?.photo}
          video={cameraProps?.video}
          audio={cameraProps?.audio}
          zoom={cameraProps?.zoom}
          enableZoomGesture={cameraProps?.enableZoomGesture}
          format={cameraProps?.format ?? format}
          fps={cameraProps?.fps ?? 10}
          lowLightBoost={cameraProps?.lowLightBoost}
          videoStabilizationMode={cameraProps?.videoStabilizationMode}
          enableDepthData={cameraProps?.enableDepthData}
          enablePortraitEffectsMatteDelivery={cameraProps?.enablePortraitEffectsMatteDelivery}
          onError={cameraProps?.onError}
          onInitialized={cameraProps?.onInitialized}
          frameProcessor={cameraProps?.frameProcessor ?? frameProcessor}
        />
      ) : undefined}
      <View style={[styles.skipButtonContainer]}>
        <Button title={skipButtonText ? skipButtonText : 'Skip'} onPress={onSkipPressed} />
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
