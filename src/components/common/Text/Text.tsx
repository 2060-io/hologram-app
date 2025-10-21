import React from 'react'
import { Text as NativeText } from 'react-native'

import { TextProps } from './TextProps'

const Text = ({ style, fontFamily, children, ...props }: TextProps) => {
  return (
    <NativeText style={[style, { fontFamily: fontFamily ?? 'EuclidCircularA-Regular' }]} {...props}>
      {children}
    </NativeText>
  )
}

export default Text
