import { DidCommCallType } from '@2060.io/credo-ts-didcomm-calls'
import React, { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View, PanResponder, FlexStyle, Animated } from 'react-native'
import { RTCView, MediaStream } from 'react-native-webrtc'

import { CallButton, HangupButton } from '../common'

import getStyles from './styles'

import { useTheme } from '@2060/hooks/providers/ThemeProvider'

const BUTTONS_TIME_FOR_DISAPPEAR = 5000

type Props = {
  didcommCallType: DidCommCallType | undefined
  isVideoCall: boolean
  localVideoStream: MediaStream | undefined
  isRemoteVideoOn: boolean
  remoteStream: MediaStream | undefined
  renderAvatar: React.JSX.Element | null
  isUsingSpeakers: boolean
  handleSwitchSpeakers: () => void
  handleSwitchCamera: () => void
  isCameraOn: boolean
  isMicrophoneOn: boolean
  handleCameraSwitched: () => void
  setIsMicrophoneOn: Dispatch<SetStateAction<boolean>>
  hangup: () => void
}

const Connected = ({
  didcommCallType,
  isVideoCall,
  localVideoStream,
  isRemoteVideoOn,
  remoteStream,
  renderAvatar,
  isUsingSpeakers,
  handleSwitchSpeakers,
  handleSwitchCamera,
  isCameraOn,
  isMicrophoneOn,
  handleCameraSwitched,
  setIsMicrophoneOn,
  hangup,
}: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { t } = useTranslation()
  const buttonsTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const panForLocalStream = useRef(new Animated.ValueXY()).current
  const [buttonsVisibility, setButtonsVisibility] = useState<FlexStyle['display']>('flex')
  const displayLocalStreaming =
    isCameraOn && !!localVideoStream && localVideoStream.getVideoTracks().length > 0

  remoteStream?.getAudioTracks().forEach(track => {
    // eslint-disable-next-line no-underscore-dangle
    track._setVolume(10)
  })

  useEffect(() => {
    startButtonsTimeout()
    return () => cleatButtonsTimeout()
  }, [])

  const cleatButtonsTimeout = () => clearTimeout(buttonsTimerRef?.current)

  const startButtonsTimeout = () => {
    buttonsTimerRef.current = setTimeout(() => {
      setButtonsVisibility('none')
    }, BUTTONS_TIME_FOR_DISAPPEAR)
  }

  const panResponderForButtons = PanResponder.create({
    onStartShouldSetPanResponderCapture: () => {
      if (buttonsVisibility === 'none') setButtonsVisibility('flex')
      cleatButtonsTimeout()
      startButtonsTimeout()
      return false
    },
  })

  const panResponderForLocalStreaming = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: panForLocalStream.x, dy: panForLocalStream.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: () => {
        panForLocalStream.extractOffset()
      },
    }),
  ).current

  const renderMainContentForVideoCall = () => {
    if (isRemoteVideoOn) {
      return (
        <RTCView
          streamURL={remoteStream?.toURL()}
          objectFit="cover"
          style={styles.remoteStreamContainer}
          zOrder={0}
        />
      )
    }
    if (displayLocalStreaming && !remoteStream) {
      return (
        <RTCView
          streamURL={localVideoStream.toURL()}
          objectFit="cover"
          style={styles.remoteStreamContainer}
          zOrder={0}
        />
      )
    }
    return <View style={styles.callingAvatar}>{renderAvatar}</View>
  }

  const renderMainContentForServiceCall = () => {
    if (isRemoteVideoOn) {
      return (
        <RTCView
          streamURL={remoteStream?.toURL()}
          objectFit="cover"
          style={styles.remoteStreamContainer}
          zOrder={0}
        />
      )
    }
    return <View style={styles.callingAvatar}>{renderAvatar}</View>
  }

  const renderMainContent: Record<DidCommCallType, React.JSX.Element> = {
    audio: <View style={styles.callingAvatar}>{renderAvatar}</View>,
    video: renderMainContentForVideoCall(),
    service: renderMainContentForServiceCall(),
  }

  return (
    <View style={styles.connectedContainer} {...panResponderForButtons.panHandlers}>
      {renderMainContent[didcommCallType!]}
      {didcommCallType === 'video' && displayLocalStreaming && !!remoteStream && (
        <Animated.View
          style={{
            transform: [{ translateX: panForLocalStream.x }, { translateY: panForLocalStream.y }],
            ...styles.localStreamContainer,
          }}
          {...panResponderForLocalStreaming.panHandlers}
        >
          <RTCView
            streamURL={localVideoStream.toURL()}
            objectFit="cover"
            style={styles.localStream}
            zOrder={1}
          />
        </Animated.View>
      )}
      <View style={[styles.buttonsContainer, { display: buttonsVisibility }]}>
        <View
          style={{ ...styles.buttonsSubContainer, display: didcommCallType === 'service' ? 'none' : 'flex' }}
        >
          <CallButton
            text={t('call.speaker')}
            iconName={isUsingSpeakers ? 'speakerOn' : 'speakerOff'}
            onPress={handleSwitchSpeakers}
          />
          {isVideoCall && (
            <>
              {isCameraOn && (
                <CallButton text={t('call.flip')} iconName="flipCamera" onPress={handleSwitchCamera} />
              )}
              <CallButton
                text={t('call.video')}
                iconName={isCameraOn ? 'video' : 'videoOff'}
                onPress={handleCameraSwitched}
              />
            </>
          )}
          <CallButton
            text={t('call.mute')}
            iconName={isMicrophoneOn ? 'microphone' : 'microphoneOff'}
            onPress={() => setIsMicrophoneOn(prevState => !prevState)}
          />
        </View>
        <HangupButton onPress={hangup} />
      </View>
    </View>
  )
}

export default Connected
