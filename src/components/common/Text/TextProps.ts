import { TextProps as NativeTextProps } from 'react-native'

export interface TextProps extends NativeTextProps {
  /**
   * The font family to use.
   * @default 'EuclidCircularA-Regular'
   */
  fontFamily?:
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
