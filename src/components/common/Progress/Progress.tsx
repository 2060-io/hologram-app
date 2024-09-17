import React from 'react'
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native'

type Props = {
  progress: number | undefined
  progressColor: string
  style?: StyleProp<ViewStyle>
}

const Progress = ({ progress = 0, progressColor, style }: Props) => {
  return (
    <View style={[styles.progressContainerCommon, styles.progressContainer, style]}>
      <View
        style={[
          styles.progressContainerCommon,
          {
            backgroundColor: progressColor,
            width: `${progress}%`,
          },
          style,
        ]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  progressContainerCommon: {
    height: 25,
    borderRadius: 20,
  },
  progressContainer: {
    width: '100%',
    backgroundColor: '#E5E9EA',
    marginBottom: 10,
  },
})
export default Progress
