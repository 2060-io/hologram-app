import * as React from 'react'
import { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react'
import AudioRecorderPlayer, { PlayBackType } from 'react-native-audio-recorder-player'

import { useScreenLock } from '../providers/ScreenLockProvider'

import { LightboxModal } from '@2060/components'
import { ChatEntryMessage } from '@2060/pages/PersonalChat/ChatMessage/Props'
import LightboxHeader from '@2060/pages/PersonalChat/ImageChatView/LightboxHeader'
import { MediaInfo } from '@2060/pages/PersonalChat/PersonalChatProps'
import VideoPlayer from '@2060/pages/PersonalChat/VideoChatView/VideoPlayer'

type AudioCallback = (args: { status: AudioStatus; data?: PlayBackType }) => void
export enum AudioStatus {
  PLAYING = 'PLAYING',
  STARTED = 'STARTED',
  PAUSED = 'PAUSED',
  RESUMED = 'RESUMED',
  FINISHED = 'FINISHED',
}

interface Props {
  children: React.ReactNode
}

type MediaPlayerContextProps = {
  playAudio: (messageId: string, filePath: string, callback: AudioCallback) => Promise<void>
  pauseAudio: () => Promise<void>
  resumeAudio: (
    messageId: string,
    filePath: string,
    timePosition: number,
    callback: AudioCallback,
  ) => Promise<void>
  audioPlaybackSpeed: number
  changeAudioPlaybackSpeed: () => Promise<void>
  seekToAudioPlayer: (timePosition: number) => Promise<void>
  playVideo(newVideoProps: VideoProps): void
  audioMessageIdFinished: string | undefined
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

const MAX_AUDIO_PLAYBACK_SPEED = 2
const MIN_AUDIO_PLAYBACK_SPEED = 0.5
const DEFAULT_AUDIO_PLAYBACK_SPEED = 1

export const MediaPlayerProvider: React.FC<React.PropsWithChildren<Props>> = ({ children }) => {
  const { forceDisableScreenLock } = useScreenLock()
  const [audioMessageIdFinished, setAudioMessageIdFinished] = useState<string>()
  const audioRecorderPlayer = useRef<AudioRecorderPlayer | undefined>()
  const currentAudioFilePath = useRef<string | undefined>()
  const currentAudioMessagePlayingId = useRef<string | undefined>()
  const currentAudioCallback = useRef<AudioCallback>(() => {})
  const currentAudioPosition = useRef(0)
  const currentAudioStatusRef = useRef<AudioStatus>()
  const [currentAudioStatus, setCurrentAudioStatus] = useState<AudioStatus>()
  const [audioPlaybackSpeed, setAudioPlaybackSpeed] = useState(DEFAULT_AUDIO_PLAYBACK_SPEED)
  const [renderVideoPlayer, setRenderVideoPlayer] = useState(false)
  const [showControl, setShowControl] = useState(true)
  const [videoState, setVideoState] = useState<VideoProps | undefined>()

  useEffect(() => {
    return () => {
      finishAudioPlayer(undefined)
    }
  }, [])

  useEffect(() => {
    currentAudioStatusRef.current = currentAudioStatus
    forceDisableScreenLock(currentAudioStatus === AudioStatus.PLAYING)
  }, [currentAudioStatus])

  const addAudioPlayBackListener = () => {
    audioRecorderPlayer?.current?.addPlayBackListener(async e => {
      if (e.isFinished) {
        await finishAudioPlayer(currentAudioMessagePlayingId.current)
      } else {
        currentAudioPosition.current = e.currentPosition
        if (currentAudioStatusRef.current !== AudioStatus.PLAYING) {
          setCurrentAudioStatus(AudioStatus.PLAYING)
        }
        currentAudioCallback.current({
          status: AudioStatus.PLAYING,
          data: e,
        })
      }
      return
    })
  }

  const startAudioPlayer = async () => {
    audioRecorderPlayer.current = new AudioRecorderPlayer()
    audioRecorderPlayer?.current?.setSubscriptionDuration(0.1)
    await audioRecorderPlayer?.current?.startPlayer(currentAudioFilePath.current)
    await setAudioRecorderPlayerPlaybackSpeed(audioPlaybackSpeed)
  }

  const playAudio = async (messageId: string, filePath: string, callback: AudioCallback) => {
    currentAudioMessagePlayingId.current = messageId
    if (currentAudioFilePath.current === undefined) {
      currentAudioFilePath.current = filePath
      currentAudioCallback.current = callback
    } else if (currentAudioFilePath.current !== filePath) {
      const isThereOtherAudioPlaying = audioRecorderPlayer.current !== undefined
      if (isThereOtherAudioPlaying) {
        await stopAudioPlayer()
        await pauseAudio()
      }
      currentAudioFilePath.current = filePath
      currentAudioCallback.current = callback
    }
    await startAudioPlayer()
    setCurrentAudioStatus(AudioStatus.STARTED)
    currentAudioCallback.current({
      status: AudioStatus.STARTED,
    })
    addAudioPlayBackListener()
  }

  const pauseAudio = async () => {
    await audioRecorderPlayer?.current?.pausePlayer()
    audioRecorderPlayer?.current?.removePlayBackListener()
    setCurrentAudioStatus(AudioStatus.PAUSED)
    currentAudioCallback.current({ status: AudioStatus.PAUSED })
  }

  const resumeAudio = async (
    messageId: string,
    filePath: string,
    timePosition: number,
    callback: AudioCallback,
  ) => {
    currentAudioMessagePlayingId.current = messageId
    const isResumingSameAudio = currentAudioFilePath.current === filePath
    if (isResumingSameAudio) {
      await audioRecorderPlayer?.current?.resumePlayer()
    } else {
      await stopAudioPlayer()
      await pauseAudio()
      currentAudioFilePath.current = filePath
      currentAudioCallback.current = callback
      await startAudioPlayer()
      await seekToAudioPlayer(timePosition)
    }
    addAudioPlayBackListener()
    setCurrentAudioStatus(AudioStatus.RESUMED)
    currentAudioCallback.current({
      status: AudioStatus.RESUMED,
    })
  }

  const stopAudioPlayer = async () => {
    await audioRecorderPlayer?.current?.stopPlayer()
    audioRecorderPlayer?.current?.removePlayBackListener()
  }

  const finishAudioPlayer = async (newMessageIdFinished?: string) => {
    await stopAudioPlayer()
    setCurrentAudioStatus(undefined)
    currentAudioPosition.current = 0
    currentAudioFilePath.current = undefined
    audioRecorderPlayer.current = undefined
    setAudioMessageIdFinished(newMessageIdFinished)
    currentAudioMessagePlayingId.current = undefined
    currentAudioCallback.current({ status: AudioStatus.FINISHED })
  }

  const changeAudioPlaybackSpeed = async () => {
    const newPlaybackSpeed =
      audioPlaybackSpeed === MAX_AUDIO_PLAYBACK_SPEED ? MIN_AUDIO_PLAYBACK_SPEED : audioPlaybackSpeed + 0.5
    await setAudioRecorderPlayerPlaybackSpeed(newPlaybackSpeed)
    setAudioPlaybackSpeed(newPlaybackSpeed)
  }

  const setAudioRecorderPlayerPlaybackSpeed = async (newPlaybackSpeed: number) => {
    await audioRecorderPlayer?.current?.setPlaybackSpeed(newPlaybackSpeed)
  }

  const seekToAudioPlayer = async (timePosition: number) => {
    await audioRecorderPlayer?.current?.seekToPlayer(timePosition)
  }

  const playVideo = useCallback(
    async (newVideoProps: VideoProps) => {
      if (currentAudioStatus === AudioStatus.PLAYING) {
        await pauseAudio()
      }
      setRenderVideoPlayer(true)
      setVideoState(newVideoProps)
    },
    [currentAudioStatus],
  )

  return (
    <MediaPlayerContext.Provider
      value={{
        playAudio,
        pauseAudio,
        resumeAudio,
        audioPlaybackSpeed,
        changeAudioPlaybackSpeed,
        seekToAudioPlayer,
        playVideo,
        audioMessageIdFinished,
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
