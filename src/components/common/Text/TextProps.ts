import React from 'react'
import { TextProps as NativeTextProps } from 'react-native'

export interface TextProps extends NativeTextProps {
  children?: React.ReactNode
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
