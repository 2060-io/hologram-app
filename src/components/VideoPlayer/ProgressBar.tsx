import { Slider } from '@sharcoux/slider'
import React from 'react'
import { View, StyleSheet } from 'react-native'

import { Text } from '@2060/components/common'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { AppTheme } from '@2060/styles'

interface Props {
  currentTime: number
  duration: number
  onSlideCapture: ({ seekTime }: { seekTime: number }) => void
  onSlideStart: () => void
  onSlideComplete: () => void
}

const getMinutesFromSeconds = (time: number) => {
  const minutes = time >= 60 ? Math.floor(time / 60) : 0
  const seconds = Math.floor(time - minutes * 60)

  return `${minutes >= 10 ? minutes : '0' + minutes}:${seconds >= 10 ? seconds : '0' + seconds}`
}

const ProgressBar = ({ currentTime, duration, onSlideCapture, onSlideComplete, onSlideStart }: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const position = getMinutesFromSeconds(currentTime)
  const fullDuration = getMinutesFromSeconds(duration)
  const handleOnSlide = (time: number) => onSlideCapture({ seekTime: time })

  return (
    <View style={styles.container}>
      <Slider
        value={currentTime}
        minimumValue={0}
        maximumValue={duration}
        step={1}
        thumbSize={12}
        trackHeight={6}
        slideOnTap={true}
        onValueChange={handleOnSlide}
        onSlidingStart={onSlideStart}
        onSlidingComplete={onSlideComplete}
        minimumTrackTintColor={theme.colors.green}
        thumbTintColor={theme.colors.green}
      />
      <View style={styles.timeWrapper}>
        <View style={styles.timeWrapper}>
          <Text style={styles.timeLeft}>{position}</Text>
          <Text style={styles.timeRight}>{fullDuration}</Text>
        </View>
      </View>
    </View>
  )
}

const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 60,
      paddingHorizontal: 15,
    },
    timeWrapper: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    timeLeft: {
      flex: 1,
      fontSize: theme.fontSize.md2,
      color: theme.colors.white,
    },
    timeRight: {
      flex: 1,
      fontSize: theme.fontSize.md2,
      color: theme.colors.white,
      textAlign: 'right',
    },
  })

export default ProgressBar
