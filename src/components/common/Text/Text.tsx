import React from 'react'
import { Text as NativeText } from 'react-native'

import { TextProps } from './TextProps'

const Text = ({ style, children, typography, ...props }: TextProps) => {
  const fontFamily = typography ? typography : 'EuclidCircularA-Regular'
  return (
    <NativeText style={[style, { fontFamily }]} {...props}>
      {children}
    </NativeText>
  )
}

export default Text
