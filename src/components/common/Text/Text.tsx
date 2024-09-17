import React from 'react'
import { Text } from 'react-native'

import { TextProps } from './TextProps'
import styles from './styles'

const CustomText = ({ style, children, error = false, typography, ...props }: TextProps) => {
  const fontFamily = typography ? typography : 'SFPro-Medium'

  return (
    <Text style={[styles.container, style, error && styles.error, { fontFamily: fontFamily }]} {...props}>
      {children}
    </Text>
  )
}

export default CustomText
