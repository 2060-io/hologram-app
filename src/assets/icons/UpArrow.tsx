import React from 'react'
import { View } from 'react-native'
import { SvgProps } from 'react-native-svg'

import Arrow from './Arrow'

const UpArrow: React.FC<SvgProps> = props => (
  <View style={{ transform: [{ rotate: '270deg' }] }}>
    <Arrow {...props} />
  </View>
)

export default UpArrow
