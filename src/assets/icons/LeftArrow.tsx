import React from 'react'
import { View } from 'react-native'
import { SvgProps } from 'react-native-svg'

import Arrow from './Arrow'

const LeftArrow: React.FC<SvgProps> = props => (
  <View style={{ transform: [{ rotate: '180deg' }] }}>
    <Arrow {...props} />
  </View>
)

export default LeftArrow
