import { PlayerState } from '@simform_solutions/react-native-audio-waveform'
import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'

import { useScreenLock } from './ScreenLockProvider'
import { useVideoCallContext } from './useVideoCallContext'

import { LightboxModal } from '@2060/components'
import { VideoMetadata } from '@2060/model'
import { ChatEntryMessage } from '@2060/pages/PersonalChat/ChatMessage/Props'
import LightboxHeader from '@2060/pages/PersonalChat/ImageChatView/LightboxHeader'
import { MediaInfo } from '@2060/pages/PersonalChat/PersonalChatProps'
import VideoPlayer from '@2060/pages/PersonalChat/VideoChatView/VideoPlayer'

type Callback = () => Promise<void>

interface Props {
  children: React.ReactNode
}

type MediaPlayerContextProps = {
  audioPlaybackSpeed: number
  changeAudioPlaybackSpeed: () => Promise<void>
  playVideo(newVideoProps: VideoProps): void
  audioMessageIdFinished: string | undefined
  updatePlayingAudioInfo: (newState: PlayerState, voiceNoteFilePath: string, callBack: Callback) => void
  updateAudioMessageIdFinished: (newAudioMessageId: string | undefined) => void
  playingAudioInfo?: PlayingAudioInfo
}

const MediaPlayerContext = createContext<MediaPlayerContextProps | undefined>(undefined)

export const useMediaPlayer = () => {
  const mediaPlayerContext = useContext(MediaPlayerContext)
  if (!mediaPlayerContext) {
    throw new Error('mediaPlayerContext must be used within a MediaPlayerProvider')
  }
  return mediaPlayerContext
}

type VideoProps = {
  videoFileUri: string
  fileMediaInfo: MediaInfo
  chatEntry: ChatEntryMessage
}

type PlayingAudioInfo = {
  state: PlayerState
  voiceNoteFilePath: string
}

const MAX_AUDIO_PLAYBACK_SPEED = 2
const MIN_AUDIO_PLAYBACK_SPEED = 0.5
const DEFAULT_AUDIO_PLAYBACK_SPEED = 1

export const MediaPlayerProvider: React.FC<React.PropsWithChildren<Props>> = ({ children }) => {
  const { isInCall } = useVideoCallContext()
  const { forceDisableScreenLock } = useScreenLock()
  const currentAudioCallback = useRef<Callback>()
  const playingAudioInfo = useRef<PlayingAudioInfo>()
  const [audioMessageIdFinished, setAudioMessageIdFinished] = useState<string>()
  const [audioPlaybackSpeed, setAudioPlaybackSpeed] = useState(DEFAULT_AUDIO_PLAYBACK_SPEED)
  const [renderVideoPlayer, setRenderVideoPlayer] = useState(false)
  const [showControl, setShowControl] = useState(true)
  const [videoState, setVideoState] = useState<VideoProps | undefined>()

  // hook to pause audio when app call is in progress
  useEffect(() => {
    if (isInCall) pauseAudioIfItIsPlaying()
  }, [isInCall])

  const pauseAudioIfItIsPlaying = useCallback(async () => {
    if (playingAudioInfo.current?.state === PlayerState.playing) {
      await currentAudioCallback.current?.()
    }
  }, [])

  const changeAudioPlaybackSpeed = useCallback(async () => {
    const newPlaybackSpeed =
      audioPlaybackSpeed === MAX_AUDIO_PLAYBACK_SPEED ? MIN_AUDIO_PLAYBACK_SPEED : audioPlaybackSpeed + 0.5
    setAudioPlaybackSpeed(newPlaybackSpeed)
  }, [audioPlaybackSpeed])

  const playVideo = useCallback(
    async (newVideoProps: VideoProps) => {
      await pauseAudioIfItIsPlaying()
      setRenderVideoPlayer(true)
      setVideoState(newVideoProps)
    },
    [playingAudioInfo],
  )

  const updatePlayingAudioInfo = useCallback(
    (newState: PlayerState, voiceNoteFilePath: string, callback: Callback) => {
      currentAudioCallback.current = callback
      const newInfo = newState === PlayerState.stopped ? undefined : { state: newState, voiceNoteFilePath }
      playingAudioInfo.current = newInfo
      forceDisableScreenLock(newState === PlayerState.playing)
    },
    [],
  )

  const updateAudioMessageIdFinished = useCallback((newAudioMessageId: string | undefined) => {
    setAudioMessageIdFinished(newAudioMessageId)
  }, [])

  return (
    <MediaPlayerContext.Provider
      value={{
        audioPlaybackSpeed,
        changeAudioPlaybackSpeed,
        updatePlayingAudioInfo,
        audioMessageIdFinished,
        updateAudioMessageIdFinished,
        playVideo,
      }}
    >
      <LightboxModal
        visible={renderVideoPlayer}
        renderHeader={close =>
          showControl &&
          videoState && (
            <LightboxHeader
              chatEntry={videoState.chatEntry}
              fileMediaInfo={videoState.fileMediaInfo}
              onBack={close}
            />
          )
        }
        onCloseModal={() => setRenderVideoPlayer(false)}
      >
        <VideoPlayer
          aspectRatio={
            ((videoState?.chatEntry.metadata as VideoMetadata)?.width ?? 1) /
            ((videoState?.chatEntry.metadata as VideoMetadata)?.height ?? 1)
          }
          uri={videoState?.videoFileUri ?? ''}
          showControl={showControl}
          setShowControl={setShowControl}
        />
      </LightboxModal>
      {children}
    </MediaPlayerContext.Provider>
  )
}
