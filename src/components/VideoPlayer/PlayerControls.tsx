import { Icon } from '@src/components/common'
import React from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

type Props = {
  playing: boolean
  onPlay(): void
  onPause(): void
  iconColor: string
}

const PlayerControls = ({ playing, onPlay, onPause, iconColor }: Props) => (
  <View style={styles.wrapper}>
    <TouchableOpacity style={styles.touchable} onPress={playing ? onPause : onPlay}>
      <Icon as="Ionicons" name={playing ? 'pause-circle-outline' : 'play-circle-outline'} size={60} color={iconColor} />
    </TouchableOpacity>
  </View>
)

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    paddingHorizontal: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  touchable: {
    padding: 5,
  },
})
export default PlayerControls
