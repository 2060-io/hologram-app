import { MrtdProblemReportReason } from '@2060.io/credo-ts-didcomm-mrtd'
import { StackScreenProps } from '@react-navigation/stack'
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake'
import {
  OrientationLock,
  lockAsync as setScreenOrientation,
  unlockAsync as resetScreenOrientation,
} from 'expo-screen-orientation'
import React, { useEffect, useRef, useState } from 'react'
import { useCameraDevices } from 'react-native-vision-camera'

import MRZCamera from './MRZCamera'
import { findAndParseMrz } from './findAndParseMrz'

import { ChatStackParams } from '@src/components/Navigation/NavigationProps'
import { useChat, useMobileAgent } from '@src/hooks/agent'

interface Props extends StackScreenProps<ChatStackParams, 'MRZScanner'> {}

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
    setScreenOrientation(OrientationLock.PORTRAIT_UP)
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      setIsActive(false)
      deactivateKeepAwake()
      resetScreenOrientation()
    })
    return unsubscribe
  }, [navigation])

  const leaveScreen = () => navigation.goBack()

  const onResult = async (mrzFinalResults: string[]) => {
    if (!chatThread?.data.connectionId) return
    agent?.modules.mrtd.sendMrzString({
      mrzData: mrzFinalResults.join('\n'),
      connectionId: chatThread.data.connectionId,
      threadId: didcommThreadId,
    })
    leaveScreen()
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

  const refuseAndLeaveScreen = () => {
    if (!chatThread?.data.connectionId) return
    agent?.modules.mrtd.sendProblemReport({
      connectionId: chatThread.data.connectionId,
      reason: MrtdProblemReportReason.MrzRefused,
      threadId: didcommThreadId,
    })
    leaveScreen()
  }

  return device && isActive ? (
    <MRZCamera
      onData={onData}
      scanSuccess={scanSuccess}
      skipScan={leaveScreen}
      cameraProps={{ device, isActive }}
      refuse={refuseAndLeaveScreen}
    />
  ) : null
}

export default MRZScanner
