import React from 'react'
import { TouchableOpacity, View, StyleSheet } from 'react-native'

import { Icon } from '@2060/components/common'
import { whiteColor } from '@2060/constants'

type Props = {
  playing: boolean
  onPlay(): void
  onPause(): void
}

const PlayerControls = ({ playing, onPlay, onPause }: Props) => (
  <View style={styles.wrapper}>
    <TouchableOpacity style={styles.touchable} onPress={playing ? onPause : onPlay}>
      <Icon
        as="Ionicons"
        name={playing ? 'pause-circle-outline' : 'play-circle-outline'}
        size={60}
        color={whiteColor}
      />
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
