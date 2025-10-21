import React from 'react'
import { Text as NativeText } from 'react-native'

import { TextProps } from './TextProps'

const Text = ({ style, fontFamily = 'EuclidCircularA-Regular', children, ...props }: TextProps) => {
  return (
    <NativeText style={[style, { fontFamily }]} {...props}>
      {children}
    </NativeText>
  )
}

export default Text
