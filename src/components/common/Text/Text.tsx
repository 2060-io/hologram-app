import React from 'react'
import { Text } from 'react-native'

import { TextProps } from './TextProps'

const CustomText = ({ style, typography, children, ...props }: TextProps) => {
  const fontFamily = typography ? typography : 'EuclidCircularA-Regular'
  return (
    <Text style={[style, { fontFamily }]} {...props}>
      {children}
    </Text>
  )
}

export default CustomText
