import React from 'react'
import { TextProps as NativeTextProps, StyleProp, TextStyle } from 'react-native'

export interface TextProps extends NativeTextProps {
  style?: StyleProp<TextStyle>
  children?: React.ReactNode
  error?: boolean
  typography?:
    | 'SFPro'
    | 'SFPro-Bold'
    | 'SFPro-Light'
    | 'SFPro-Medium'
    | 'EuclidCircularA-Bold'
    | 'EuclidCircularA-BoldItalic'
    | 'EuclidCircularA-Italic'
    | 'EuclidCircularA-Light'
    | 'EuclidCircularA-LightItalic'
    | 'EuclidCircularA-Medium'
    | 'EuclidCircularA-MediumItalic'
    | 'EuclidCircularA-Regular'
    | 'EuclidCircularA-SemiBold'
    | 'EuclidCircularA-SemiBoldItalic'
}
