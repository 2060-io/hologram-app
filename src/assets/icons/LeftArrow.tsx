import React from 'react'
import { StyleSheet, View } from 'react-native'
import { SvgProps } from 'react-native-svg'

import Arrow from './Arrow'

const LeftArrow: React.FC<SvgProps> = (props) => (
  <View style={styles.container}>
    <Arrow {...props} />
  </View>
)

const styles = StyleSheet.create({
  container: {
    transform: [{ rotate: '180deg' }],
  },
})

export default LeftArrow
