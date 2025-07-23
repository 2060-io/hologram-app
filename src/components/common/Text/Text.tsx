import React from 'react'
import { Text } from 'react-native'

import { TextProps } from './TextProps'

const CustomText = ({ style, children, typography, ...props }: TextProps) => {
  const fontFamily = typography ? typography : 'SFPro-Medium'
  return (
    <Text style={[style, { fontFamily: fontFamily }]} {...props}>
      {children}
    </Text>
  )
}

export default CustomText
