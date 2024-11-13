import { StackScreenProps } from '@react-navigation/stack'
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake'
import React, { useEffect, useRef, useState } from 'react'
import { useCameraDevices } from 'react-native-vision-camera'

import MRZCamera from './MRZCamera'
import { findAndParseMrz } from './findAndParseMrz'

import { PersonalChatStackParams } from '@2060/components/Navigation/NavigationProps'
import { useChat, useMobileAgent } from '@2060/hooks/agent'

interface Props extends StackScreenProps<PersonalChatStackParams, 'MRZScanner'> {}

const MRZScanner = ({ navigation, route }: Props) => {
  const devices = useCameraDevices()
  const device = devices.find(dev => dev.position === 'back')
  const [isActive, setIsActive] = useState(true)
  const [scanSuccess, setScanSuccess] = useState(false)
  const scanSuccessAux = useRef(false)
  const { agent } = useMobileAgent()
  const { chatThread } = useChat()
  const { didcommThreadId } = route.params

  useEffect(() => {
    activateKeepAwakeAsync()
    return () => {
      deactivateKeepAwake()
      setIsActive(false)
    }
  }, [])

  const skipScan = () => navigation.goBack()

  const onResult = async (mrzFinalResults: string[]) => {
    agent?.modules.mrtd.sendMrzString({
      mrzData: mrzFinalResults.join('\n'),
      connectionId: chatThread?.data.connectionId!,
      threadId: didcommThreadId,
    })
    navigation.goBack()
  }

  const onData = (lines: string[]) => {
    const mrzResults = findAndParseMrz(lines)
    if (mrzResults && !scanSuccessAux.current) {
      scanSuccessAux.current = true
      setScanSuccess(true)
      setIsActive(false)
      onResult(mrzResults.lines)
    }
  }

  return device && isActive ? (
    <MRZCamera
      onData={onData}
      scanSuccess={scanSuccess}
      skipScan={skipScan}
      cameraProps={{ device, isActive }}
    />
  ) : null
}

export default MRZScanner
