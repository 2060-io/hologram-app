import React, { useState, createRef, Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { View, Pressable } from 'react-native'
import Video, { OnLoadData, OnProgressData, VideoRef } from 'react-native-video'

import PlayerControls from './PlayerControls'
import ProgressBar from './ProgressBar'
import getStyles from './styles'

import { Text } from '@src/components/common'
import { useTheme } from '@src/hooks/providers/ThemeProvider'

type Props = {
  uri: string
  showControl: boolean
  setShowControl: React.Dispatch<React.SetStateAction<boolean>>
}

const VideoPlayer = ({ uri, showControl, setShowControl }: Props) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const [isReadyVideo, setIsReadyVideo] = useState(false)
  const [errorLoadingVideo, setErrorLoadingVideo] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [play, setPlay] = useState(true)
  const videoRef = createRef<VideoRef>()

  const handlePlayPause = () => {
    if (play) {
      setPlay(false)
      setShowControl(true)
      return
    }
    setTimeout(() => setShowControl(false), 2000)
    setPlay(true)
  }

  const handlePlay = () => {
    setTimeout(() => setShowControl(false), 500)
    setPlay(true)
  }

  const handleControls = () => {
    if (showControl) setShowControl(false)
    else setShowControl(true)
  }

  const onLoadEnd = (data: OnLoadData) => {
    setDuration(Math.floor(data.duration))
    setCurrentTime(Math.floor(data.currentTime))
    setIsReadyVideo(true)
  }

  const onErrorLoadingVideo = () => {
    setIsReadyVideo(false)
    setErrorLoadingVideo(true)
  }

  const onProgress = (data: OnProgressData) => {
    setCurrentTime(data.currentTime)
  }

  const onSeek = (data: { seekTime: number }) => {
    videoRef.current?.seek(data.seekTime)
    setCurrentTime(data.seekTime)
  }

  const onEnd = () => {
    setDuration(0)
    setCurrentTime(0)
    videoRef.current?.seek(0)
    setPlay(false)
  }

  return (
    <Pressable onPress={handleControls} style={styles.container}>
      <Fragment>
        <View pointerEvents="none">
          <Video
            ref={videoRef}
            source={{ uri }}
            style={styles.container}
            repeat={false}
            controls={false}
            resizeMode="contain"
            paused={!play && isReadyVideo}
            volume={10}
            onLoad={onLoadEnd}
            onProgress={onProgress}
            onError={onErrorLoadingVideo}
            onEnd={onEnd}
          />
        </View>
        {errorLoadingVideo && (
          <View style={styles.contentCenter}>
            <Text style={styles.errorLoadingVideoText}>{t('chat.errorLoadingVideo')}</Text>
          </View>
        )}
        {showControl && isReadyVideo && (
          <View style={styles.controlOverlay}>
            <PlayerControls
              onPlay={handlePlay}
              onPause={handlePlayPause}
              playing={play}
              iconColor={theme.colors.white}
            />
            <ProgressBar
              currentTime={currentTime}
              duration={duration > 0 ? duration : 0}
              onSlideStart={handlePlayPause}
              onSlideComplete={handlePlayPause}
              onSlideCapture={onSeek}
            />
          </View>
        )}
      </Fragment>
    </Pressable>
  )
}

export default VideoPlayer
