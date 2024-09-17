import { ViewStyle, StyleProp, ModalProps } from 'react-native'

export interface CustomModalProps extends ModalProps {
  topHeight?: string
  style?: StyleProp<ViewStyle>
  children: React.ReactNode
}
