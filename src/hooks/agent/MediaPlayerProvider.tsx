import { PlayerState, useAudioPlayer } from '@simform_solutions/react-native-audio-waveform'
import * as React from 'react'
import { createContext, useContext, useState, useCallback } from 'react'

import { useScreenLock } from '../providers/ScreenLockProvider'

import { LightboxModal } from '@2060/components'
import { ChatEntryMessage } from '@2060/pages/PersonalChat/ChatMessage/Props'
import LightboxHeader from '@2060/pages/PersonalChat/ImageChatView/LightboxHeader'
import { MediaInfo } from '@2060/pages/PersonalChat/PersonalChatProps'
import VideoPlayer from '@2060/pages/PersonalChat/VideoChatView/VideoPlayer'

interface Props {
  children: React.ReactNode
}

type MediaPlayerContextProps = {
  audioPlaybackSpeed: number
  changeAudioPlaybackSpeed: () => Promise<void>
  playVideo(newVideoProps: VideoProps): void
  audioMessageIdFinished: string | undefined
  updatePlayingAudioInfo: (newState: PlayerState, voiceNoteFilePath: string) => void
  updateAudioMessageIdFinished: (newAudioMessageId: string | undefined) => void
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
  currentMessage: ChatEntryMessage
}

type PlayingAudioInfo = {
  state: PlayerState
  voiceNoteFilePath: string
}

const MAX_AUDIO_PLAYBACK_SPEED = 2
const MIN_AUDIO_PLAYBACK_SPEED = 0.5
const DEFAULT_AUDIO_PLAYBACK_SPEED = 1

export const MediaPlayerProvider: React.FC<React.PropsWithChildren<Props>> = ({ children }) => {
  const { pausePlayer } = useAudioPlayer()
  const { forceDisableScreenLock } = useScreenLock()
  const [playingAudioInfo, setPlayingAudioInfo] = useState<PlayingAudioInfo>()
  const [audioMessageIdFinished, setAudioMessageIdFinished] = useState<string>()
  const [audioPlaybackSpeed, setAudioPlaybackSpeed] = useState(DEFAULT_AUDIO_PLAYBACK_SPEED)
  const [renderVideoPlayer, setRenderVideoPlayer] = useState(false)
  const [showControl, setShowControl] = useState(true)
  const [videoState, setVideoState] = useState<VideoProps | undefined>()

  const changeAudioPlaybackSpeed = useCallback(async () => {
    const newPlaybackSpeed =
      audioPlaybackSpeed === MAX_AUDIO_PLAYBACK_SPEED ? MIN_AUDIO_PLAYBACK_SPEED : audioPlaybackSpeed + 0.5
    setAudioPlaybackSpeed(newPlaybackSpeed)
  }, [audioPlaybackSpeed])

  const playVideo = useCallback(
    async (newVideoProps: VideoProps) => {
      if (playingAudioInfo?.state === PlayerState.playing) {
        await pausePlayer({ playerKey: `PlayerFor${playingAudioInfo.voiceNoteFilePath}` })
      }
      setRenderVideoPlayer(true)
      setVideoState(newVideoProps)
    },
    [playingAudioInfo],
  )

  const updatePlayingAudioInfo = useCallback((newState: PlayerState, voiceNoteFilePath: string) => {
    const newInfo = newState === PlayerState.stopped ? undefined : { state: newState, voiceNoteFilePath }
    setPlayingAudioInfo(newInfo)
    forceDisableScreenLock(newState === PlayerState.playing)
  }, [])

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
              currentMessage={videoState.currentMessage}
              fileMediaInfo={videoState.fileMediaInfo}
              onBack={close}
            />
          )
        }
        onCloseModal={() => setRenderVideoPlayer(false)}
      >
        <VideoPlayer
          uri={videoState?.videoFileUri ?? ''}
          showControl={showControl}
          setShowControl={setShowControl}
        />
      </LightboxModal>
      {children}
    </MediaPlayerContext.Provider>
  )
}
