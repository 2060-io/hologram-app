import React, { useState, createRef, Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { View, StyleSheet, TouchableHighlight, ActivityIndicator } from 'react-native'
import Video, { OnLoadData, OnProgressData, VideoRef } from 'react-native-video'

import PlayerControls from './PlayerControls'
import ProgressBar from './ProgressBar'

import { Text } from '@2060/components/common'
import { whiteColor } from '@2060/constants'

type Props = {
  uri: string
  showControl: boolean
  setShowControl: React.Dispatch<React.SetStateAction<boolean>>
  initialPlay?: boolean
  showProgressBar?: boolean
}

const VideoPlayer = ({
  uri,
  showControl,
  setShowControl,
  initialPlay = true,
  showProgressBar = true,
}: Props) => {
  const [isLoadingVideo, setIsLoadingVideo] = useState(false)
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
    setIsLoadingVideo(false)
  }

  const onErrorLoadingVideo = () => {
    setIsReadyVideo(false)
    setIsLoadingVideo(false)
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
    <TouchableHighlight onPress={handleControls} style={styles.container}>
      <Fragment>
        <Video
          ref={videoRef}
          source={{ uri }}
          style={styles.video}
          repeat={false}
          controls={false}
          resizeMode="cover"
          paused={!play && isReadyVideo}
          volume={10}
          onLoad={onLoadEnd}
          onProgress={onProgress}
          onError={onErrorLoadingVideo}
          onEnd={onEnd}
          onLoadStart={() => setIsLoadingVideo(true)}
        />
        {errorLoadingVideo && (
          <View style={styles.contentCenter}>
            <Text style={styles.styleText}>{t('personalChat.errorLoadingVideo')}</Text>
          </View>
        )}
        {isLoadingVideo && (
          <View style={styles.contentCenter}>
            <ActivityIndicator size="large" color={whiteColor} accessibilityLabel="loading video..." />
            <Text style={styles.styleText}>{t('general.loading')}</Text>
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
    </TouchableHighlight>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ebebeb',
    height: '100%',
  },
  video: {
    height: '100%',
    width: '100%',
    backgroundColor: 'black',
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
    zIndex: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  styleText: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 18,
    color: whiteColor,
  },
})

export default VideoPlayer
