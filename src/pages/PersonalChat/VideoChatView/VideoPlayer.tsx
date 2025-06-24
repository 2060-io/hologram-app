import React, { useState, createRef, Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import Video, { OnLoadData, OnProgressData, VideoRef } from 'react-native-video'

import PlayerControls from './PlayerControls'
import ProgressBar from './ProgressBar'

import { Text } from '@2060/components/common'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'

type Props = {
  uri: string
  aspectRatio: number
  showControl: boolean
  setShowControl: React.Dispatch<React.SetStateAction<boolean>>
  initialPlay?: boolean
  showProgressBar?: boolean
}

const VideoPlayer = ({
  uri,
  aspectRatio,
  showControl,
  setShowControl,
  initialPlay = true,
  showProgressBar = true,
}: Props) => {
  const theme = useTheme()
  const [isReadyVideo, setIsReadyVideo] = useState(false)
  const [errorLoadingVideo, setErrorLoadingVideo] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [play, setPlay] = useState(initialPlay)

  const videoRef = createRef<VideoRef>()
  const { t } = useTranslation()

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
    <TouchableOpacity onPress={handleControls} style={styles.container} activeOpacity={1}>
      <Fragment>
        <Video
          ref={videoRef}
          source={{ uri }}
          style={{ ...styles.video, aspectRatio }}
          repeat={false}
          controls={false}
          paused={!play && isReadyVideo}
          volume={10}
          onLoad={onLoadEnd}
          onProgress={onProgress}
          onError={onErrorLoadingVideo}
          onEnd={onEnd}
        />
        {errorLoadingVideo && (
          <View style={styles.contentCenter}>
            <Text
              typography="EuclidCircularA-Regular"
              style={{ color: theme.colors.primaryText, fontSize: theme.fontSize.lg, marginTop: 10 }}
            >
              {t('personalChat.errorLoadingVideo')}
            </Text>
          </View>
        )}
        {showControl && isReadyVideo && (
          <View style={styles.controlOverlay}>
            <PlayerControls onPlay={handlePlay} onPause={handlePlayPause} playing={play} />
            {showProgressBar && (
              <ProgressBar
                currentTime={currentTime}
                duration={duration > 0 ? duration : 0}
                onSlideStart={handlePlayPause}
                onSlideComplete={handlePlayPause}
                onSlideCapture={onSeek}
              />
            )}
          </View>
        )}
      </Fragment>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    height: '100%',
    justifyContent: 'center',
  },
  video: {
    height: undefined,
    width: '100%',
  },
  controlOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0, 0.3)',
  },
  contentCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
})

export default VideoPlayer
