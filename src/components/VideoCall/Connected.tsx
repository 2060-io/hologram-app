import React, { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View, PanResponder, FlexStyle, Animated } from 'react-native'
import { RTCView, MediaStream } from 'react-native-webrtc'

import { CallButton, HangupButton } from '../common'

import getStyles from './styles'

import { useTheme } from '@2060/hooks/providers/ThemeProvider'

const BUTTONS_TIME_FOR_DISAPPEAR = 5000

type Props = {
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
  handleCamera: () => void
  setIsMicrophoneOn: Dispatch<SetStateAction<boolean>>
  hangup: () => void
}

const Connected = ({
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
  handleCamera,
  setIsMicrophoneOn,
  hangup,
}: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { t } = useTranslation()
  const buttonsTimerRef = useRef<ReturnType<typeof setTimeout>>()
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

  const renderMainContent = () => {
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

  return (
    <View style={styles.connectedContainer} {...panResponderForButtons.panHandlers}>
      {renderMainContent()}
      {displayLocalStreaming && !!remoteStream && (
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
        <View style={styles.buttonsSubContainer}>
          <CallButton
            text={t('call.speaker')}
            iconName={isUsingSpeakers ? 'speakerOn' : 'speakerOff'}
            onPress={handleSwitchSpeakers}
          />
          {isVideoCall && (
            <>
              <CallButton text={t('call.flip')} iconName="flipCamera" onPress={handleSwitchCamera} />
              <CallButton
                text={t('call.video')}
                iconName={isCameraOn ? 'video' : 'videoOff'}
                onPress={handleCamera}
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
